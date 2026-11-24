from datetime import UTC, datetime, timedelta

from app.features.tracker import EnteredStage, build_timeline
from app.rules.loader import Track

NOW = datetime(2026, 11, 24, 12, tzinfo=UTC)


def test_crop_report_window_is_72h_from_event() -> None:
    event = NOW - timedelta(hours=30)
    t = build_timeline(Track.CROP, event, [], NOW)
    first = t.stages[0]
    assert first.stage_code == "loss_reported"
    assert first.due_at == event + timedelta(hours=72)
    assert t.intimation_due_at == event + timedelta(hours=72)
    assert t.overdue_days == 0


def test_crop_surveyor_due_48h_after_intimation_and_payment_15d_after_survey() -> None:
    event = NOW - timedelta(days=31)
    reported = event + timedelta(hours=18)
    survey = NOW - timedelta(days=24)
    entered = [
        EnteredStage(stage_code="loss_reported", entered_at=reported),
        EnteredStage(stage_code="joint_survey_done", entered_at=survey),
    ]
    t = build_timeline(Track.CROP, event, entered, NOW)
    surveyor = next(s for s in t.stages if s.stage_code == "surveyor_appointed")
    assert surveyor.due_at == reported + timedelta(hours=48)
    assert t.expected_settlement_date == survey + timedelta(days=15)
    # Earliest missed deadline is the surveyor appointment.
    assert t.overdue_days == 29
    assert t.has_interest_claim is False


def test_health_decision_due_30_days_after_submission_with_interest() -> None:
    submitted = NOW - timedelta(days=34)
    t = build_timeline(
        Track.HEALTH,
        submitted - timedelta(days=6),
        [EnteredStage(stage_code="submitted", entered_at=submitted)],
        NOW,
    )
    assert t.expected_settlement_date == submitted + timedelta(days=30)
    assert t.overdue_days == 4
    assert t.has_interest_claim is True
    assert t.current_stage == "submitted"


def test_no_due_date_once_settlement_stage_reached() -> None:
    s = NOW - timedelta(days=5)
    entered = [
        EnteredStage(stage_code="submitted", entered_at=s),
        EnteredStage(stage_code="decision", entered_at=NOW),
    ]
    assert build_timeline(Track.HEALTH, s, entered, NOW).expected_settlement_date is None
