"""Typed, cached loader for rules/{track}.yaml (rules.md §8 'Track rules')."""

from enum import StrEnum
from functools import cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field

RULES_DIR = Path(__file__).parent


class Track(StrEnum):
    HEALTH = "health"
    CROP = "crop"


Severity = Literal["critical", "high", "medium"]


class ChecklistItem(BaseModel):
    code: str
    required_when: str | None = None


class CheckSpec(BaseModel):
    code: str
    severity: Severity


class Deadline(BaseModel):
    stage: str
    from_: str = Field(alias="from")
    hours: int


class ScoreWeights(BaseModel):
    completeness: int
    validity: int
    coverage: int
    timeliness: int


class TrackRules(BaseModel):
    track: Track
    intimation_window_hours: int
    score_weights: ScoreWeights
    checklist: list[ChecklistItem]
    checks: dict[str, list[CheckSpec]]
    stages: list[str]
    draft_stage: str | None
    submit_stages: list[str]
    insurer_actor: Literal["insurer", "tpa"]
    deadlines: list[Deadline]
    settlement_stage: str
    has_overdue_interest: bool
    escalation_channels: list[str]


@cache
def load_rules(track: Track) -> TrackRules:
    """Read and validate the YAML for one track (cached for the process lifetime)."""
    raw = yaml.safe_load((RULES_DIR / f"{track.value}.yaml").read_text(encoding="utf-8"))
    return TrackRules.model_validate(raw)
