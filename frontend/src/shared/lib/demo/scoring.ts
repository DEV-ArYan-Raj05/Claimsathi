/**
 * Demo readiness score (PRD §3.4). Weights come from track config, never hard-coded here.
 * Mirrors backend/app/features/scoring/service.py — keep the two in step.
 */
import type { Bilingual, ChecklistItem, ReadinessScore, ScoreItem } from "../../api/contract";
import { trackConfig } from "../../config/tracks";
import type { DemoClaim, DemoDocument } from "./types";

const PENALTY = { critical: 0.34, high: 0.15, medium: 0.05 } as const;

export function activeDocs(docs: DemoDocument[]): DemoDocument[] {
  const replaced = new Set(docs.map((d) => d.replaces).filter(Boolean));
  return docs.filter((d) => !replaced.has(d.id));
}

export function buildChecklist(claim: DemoClaim, docs: DemoDocument[]): ChecklistItem[] {
  const live = activeDocs(docs);
  return trackConfig(claim.track).checklist.map(({ code, requiredWhen }) => {
    const mine = live.filter((d) => d.checklist_item === code && d.status === "done");
    return {
      code,
      required: requiredWhen ? Boolean(claim.incident[requiredWhen]) : true,
      uploaded: mine.length,
      failing: mine.filter((d) =>
        d.checks.some((c) => !c.passed && !c.overridden_reason && c.severity !== "medium"),
      ).length,
    };
  });
}

function band(score: number): ReadinessScore["band"] {
  if (score >= 80) return "ready";
  return score >= 60 ? "fix" : "high_risk";
}

const r = (en: string, hi: string): Bilingual => ({ en, hi });

/** Compute the 0–100 readiness score with every lost point explained. */
export function computeScore(
  claim: DemoClaim,
  docs: DemoDocument[],
  intimationDueAt: string,
): ReadinessScore {
  const w = trackConfig(claim.track).scoreWeights;
  const checklist = buildChecklist(claim, docs);
  const required = checklist.filter((c) => c.required);
  const missing = required.filter((c) => c.uploaded === 0);
  const completeness: ScoreItem = {
    component: "completeness",
    max: w.completeness,
    got: Math.round(
      (w.completeness * (required.length - missing.length)) / Math.max(required.length, 1),
    ),
    reasons: missing.length
      ? [
          r(
            `${missing.length} required documents not uploaded`,
            `${missing.length} ज़रूरी दस्तावेज़ अपलोड नहीं हुए`,
          ),
        ]
      : [],
  };

  const failed = activeDocs(docs)
    .flatMap((d) => d.checks)
    .filter((c) => !c.passed && !c.overridden_reason);
  const loss = failed.reduce((acc, c) => acc + PENALTY[c.severity], 0);
  const validity: ScoreItem = {
    component: "validity",
    max: w.validity,
    got: Math.round(w.validity * Math.max(0, 1 - loss)),
    reasons: failed.map((c) => c.message),
  };

  const warnings = claim.coverage_warnings.filter((c) => c.risk === "high");
  const coverage: ScoreItem = {
    component: "coverage",
    max: w.coverage,
    got: warnings.length ? Math.round(w.coverage / 2) : w.coverage,
    reasons: warnings.map((c) => c.title),
  };

  const intimated = claim.intimated_at ?? new Date().toISOString();
  const isLate = new Date(intimated) > new Date(intimationDueAt);
  const timeliness: ScoreItem = {
    component: "timeliness",
    max: w.timeliness,
    got: isLate ? 0 : w.timeliness,
    reasons: isLate
      ? [r("Insurer was told after the deadline", "बीमा कंपनी को समय-सीमा के बाद बताया गया")]
      : [],
  };

  const breakdown = [completeness, validity, coverage, timeliness];
  const score = breakdown.reduce((acc, b) => acc + b.got, 0);
  return { score, band: band(score), breakdown };
}
