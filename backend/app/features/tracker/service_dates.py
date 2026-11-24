"""
Stage due dates, expected settlement and overdue maths (PRD §3.5). All dates in code, UTC;
convert to Asia/Kolkata only for display. Rules come from the track YAML `deadlines`.
"""

import math
from datetime import datetime, timedelta

from pydantic import BaseModel

from app.rules.loader import Track, load_rules


class EnteredStage(BaseModel):
    stage_code: str
    entered_at: datetime


class TimelineStage(BaseModel):
    stage_code: str
    entered_at: datetime | None
    due_at: datetime | None
    is_overdue: bool


class Timeline(BaseModel):
    stages: list[TimelineStage]
    current_stage: str | None
    expected_settlement_date: datetime | None
    intimation_due_at: datetime
    overdue_days: int
    has_interest_claim: bool


def build_timeline(track: Track, event_at: datetime, entered: list[EnteredStage], now: datetime) -> Timeline:
    """Lay out every stage for the track with due dates for those not reached yet."""
    rules = load_rules(track)
    by_code = {s.stage_code: s.entered_at for s in entered}

    def anchor(source: str) -> datetime | None:
        return event_at if source == "event" else by_code.get(source)

    def due_for(code: str) -> datetime | None:
        rule = next((d for d in rules.deadlines if d.stage == code), None)
        base = anchor(rule.from_) if rule else None
        return base + timedelta(hours=rule.hours) if rule and base else None

    stages = []
    for code in rules.stages:
        entered_at = by_code.get(code)
        due = None if entered_at else due_for(code)
        stages.append(
            TimelineStage(
                stage_code=code, entered_at=entered_at, due_at=due, is_overdue=bool(due and due < now)
            )
        )

    late = [s.due_at for s in stages if s.is_overdue and s.due_at]
    overdue_days = math.ceil((now - min(late)) / timedelta(days=1)) if late else 0
    reached = [s.stage_code for s in stages if s.entered_at]
    settlement_due = None if rules.settlement_stage in by_code else due_for(rules.settlement_stage)
    return Timeline(
        stages=stages,
        current_stage=reached[-1] if reached else None,
        expected_settlement_date=settlement_due,
        intimation_due_at=event_at + timedelta(hours=rules.intimation_window_hours),
        overdue_days=overdue_days,
        has_interest_claim=overdue_days > 0 and rules.has_overdue_interest,
    )
