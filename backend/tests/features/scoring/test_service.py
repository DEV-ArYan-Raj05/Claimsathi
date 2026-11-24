from datetime import UTC, datetime, timedelta

from app.features.scoring import DocumentState, ScoreInput, compute_readiness_score
from app.features.scoring.schemas import Bilingual, FailedCheck
from app.rules.loader import Track

NOW = datetime(2026, 11, 24, 12, tzinfo=UTC)
MSG = Bilingual(en="x", hi="x")


def _input(
    track: Track, docs: list[DocumentState], intimated_after_h: float | None = 10, **incident: bool
) -> ScoreInput:
    event = NOW - timedelta(days=3)
    intimated = event + timedelta(hours=intimated_after_h) if intimated_after_h is not None else None
    return ScoreInput(
        track=track, incident=dict(incident), documents=docs, event_at=event, intimated_at=intimated, now=NOW
    )


def test_health_demo_claim_scores_55_high_risk() -> None:
    docs = [
        DocumentState(
            checklist_item="bills",
            failed_checks=[FailedCheck(code="BILL_STAMP_MISSING", severity="critical", message=MSG)],
        ),
        DocumentState(
            checklist_item="bills",
            failed_checks=[FailedCheck(code="BILL_TOTAL_MISMATCH", severity="high", message=MSG)],
        ),
        DocumentState(
            checklist_item="prescriptions",
            failed_checks=[FailedCheck(code="DOCTOR_REG_MISSING", severity="critical", message=MSG)],
        ),
        DocumentState(checklist_item="policy_copy"),
    ]
    result = compute_readiness_score(_input(Track.HEALTH, docs))
    got = {b.component: b.got for b in result.breakdown}
    assert got == {"completeness": 15, "validity": 5, "coverage": 20, "timeliness": 15}
    assert (result.score, result.band) == (55, "high_risk")


def test_overridden_failure_costs_nothing() -> None:
    failed = FailedCheck(code="BILL_STAMP_MISSING", severity="critical", message=MSG, is_overridden=True)
    result = compute_readiness_score(
        _input(Track.HEALTH, [DocumentState(checklist_item="bills", failed_checks=[failed])])
    )
    assert next(b for b in result.breakdown if b.component == "validity").got == 30


def test_fir_only_required_for_accidents() -> None:
    docs = [
        DocumentState(checklist_item=c)
        for c in [
            "claim_form",
            "policy_copy",
            "id_bank_proof",
            "bills",
            "prescriptions",
            "discharge_summary",
            "investigation_reports",
        ]
    ]
    assert compute_readiness_score(_input(Track.HEALTH, docs)).score == 100
    assert compute_readiness_score(_input(Track.HEALTH, docs, is_accident=True)).score < 100


def test_crop_weights_and_late_intimation() -> None:
    result = compute_readiness_score(_input(Track.CROP, [], intimated_after_h=80))
    maxima = {b.component: b.max for b in result.breakdown}
    assert maxima == {"completeness": 30, "validity": 20, "coverage": 25, "timeliness": 25}
    assert next(b for b in result.breakdown if b.component == "timeliness").got == 0


def test_band_edges() -> None:
    docs = [
        DocumentState(checklist_item=c)
        for c in [
            "intimation_docket",
            "pmfby_policy",
            "aadhaar_passbook",
            "geo_photos",
            "land_record",
            "sowing_cert",
            "premium_proof",
            "claim_form",
        ]
    ]
    assert compute_readiness_score(_input(Track.CROP, docs)).band == "ready"
