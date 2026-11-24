"""
Readiness score: 0-100, every lost point explained, weights from rules/{track}.yaml.
It measures paperwork readiness, never odds of approval (PRD §3.4, rules.md §9).
"""

from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

from app.features.scoring.schemas import Bilingual, ReadinessScore, ScoreInput, ScoreItem
from app.rules.loader import load_rules

# How much of the validity component one open failure costs, by severity.
PENALTY = {"critical": Decimal("0.34"), "high": Decimal("0.15"), "medium": Decimal("0.05")}


def _round(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _band(score: int) -> Literal["ready", "fix", "high_risk"]:
    if score >= 80:
        return "ready"
    return "fix" if score >= 60 else "high_risk"


def _completeness(data: ScoreInput, weight: int) -> ScoreItem:
    rules = load_rules(data.track)
    uploaded = {d.checklist_item for d in data.documents}
    required = [c.code for c in rules.checklist if not c.required_when or data.incident.get(c.required_when)]
    missing = [c for c in required if c not in uploaded]
    got = _round(Decimal(weight) * (len(required) - len(missing)) / max(len(required), 1))
    reasons = []
    if missing:
        n = len(missing)
        reasons = [Bilingual(en=f"{n} required documents not uploaded", hi=f"{n} ज़रूरी दस्तावेज़ अपलोड नहीं हुए")]
    return ScoreItem(component="completeness", max=weight, got=got, reasons=reasons)


def _validity(data: ScoreInput, weight: int) -> ScoreItem:
    failed = [f for d in data.documents for f in d.failed_checks if not f.is_overridden]
    loss = sum((PENALTY[f.severity] for f in failed), Decimal("0"))
    got = _round(Decimal(weight) * max(Decimal("0"), Decimal("1") - loss))
    return ScoreItem(component="validity", max=weight, got=got, reasons=[f.message for f in failed])


def _coverage(data: ScoreInput, weight: int) -> ScoreItem:
    if not data.high_risk_warnings:
        return ScoreItem(component="coverage", max=weight, got=weight, reasons=[])
    return ScoreItem(
        component="coverage", max=weight, got=_round(Decimal(weight) / 2), reasons=data.high_risk_warnings
    )


def _timeliness(data: ScoreInput, weight: int) -> ScoreItem:
    due = data.event_at + timedelta(hours=load_rules(data.track).intimation_window_hours)
    told_at = data.intimated_at or data.now
    if told_at <= due:
        return ScoreItem(component="timeliness", max=weight, got=weight, reasons=[])
    late = Bilingual(en="Insurer was told after the deadline", hi="बीमा कंपनी को समय-सीमा के बाद बताया गया")
    return ScoreItem(component="timeliness", max=weight, got=0, reasons=[late])


def compute_readiness_score(data: ScoreInput) -> ReadinessScore:
    """Score one claim from its documents, warnings and dates."""
    w = load_rules(data.track).score_weights
    breakdown = [
        _completeness(data, w.completeness),
        _validity(data, w.validity),
        _coverage(data, w.coverage),
        _timeliness(data, w.timeliness),
    ]
    score = sum(b.got for b in breakdown)
    return ReadinessScore(score=score, band=_band(score), breakdown=breakdown)
