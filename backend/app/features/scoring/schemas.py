"""Pydantic models for the readiness score (mirrors ReadinessScore in frontend contract.ts)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.rules.loader import Severity, Track

Component = Literal["completeness", "validity", "coverage", "timeliness"]


class Bilingual(BaseModel):
    en: str
    hi: str


class FailedCheck(BaseModel):
    code: str
    severity: Severity
    message: Bilingual
    is_overridden: bool = False


class DocumentState(BaseModel):
    checklist_item: str
    failed_checks: list[FailedCheck] = []


class ScoreInput(BaseModel):
    track: Track
    incident: dict[str, str | int | float | bool]
    documents: list[DocumentState]
    high_risk_warnings: list[Bilingual] = []
    event_at: datetime
    intimated_at: datetime | None
    now: datetime


class ScoreItem(BaseModel):
    component: Component
    max: int
    got: int
    reasons: list[Bilingual]


class ReadinessScore(BaseModel):
    score: int
    band: Literal["ready", "fix", "high_risk"]
    breakdown: list[ScoreItem]
