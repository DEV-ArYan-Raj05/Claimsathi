"""
Rule checks on extracted document fields (PRD §3.3). The vision model only answers yes/no
(has_stamp, has_signature); every rule, date window and sum runs here in Python.
Adding a check = a YAML entry in rules/{track}.yaml + one function registered below.
"""

import re
from collections.abc import Callable
from datetime import date, datetime, timedelta
from decimal import Decimal
from difflib import SequenceMatcher

from pydantic import BaseModel

from app.features.documents.service_bills import BillItem, line_items_match_total
from app.rules.loader import Severity, Track, load_rules

LEGIBILITY_MIN = 0.6
NAME_MATCH_MIN = 0.85
# State medical council / NMC registration formats, e.g. "DMC/R/12345", "HMC-4521", "MCI 77821/2009".
DOCTOR_REG_RE = re.compile(r"^(?:[A-Z]{2,6}[\s/-]?(?:R[\s/-]?)?)?\d{3,7}(?:/\d{2,4})?$")


class ExtractedDocument(BaseModel):
    """Fields pulled from one document by OCR + vision yes/no answers."""

    has_stamp: bool | None = None
    has_signature: bool | None = None
    doctor_reg_no: str | None = None
    provider_name: str | None = None
    patient_name: str | None = None
    bill_date: date | None = None
    bill_no: str | None = None
    items: list[BillItem] = []
    stated_total: Decimal | None = None
    ocr_confidence: float = 1.0
    phash: str | None = None
    has_gps: bool | None = None
    is_inside_plot_area: bool | None = None
    photo_taken_at: datetime | None = None
    survey_no: str | None = None
    land_owner_name: str | None = None


class CheckContext(BaseModel):
    """Claim/policy facts the checks compare against."""

    insured_names: list[str] = []
    policy_start: date | None = None
    policy_end: date | None = None
    event_at: datetime | None = None
    intimated_at: datetime | None = None
    policy_survey_nos: list[str] = []
    other_phashes: list[str] = []
    intimation_window_hours: int = 72


class CheckOutcome(BaseModel):
    code: str
    severity: Severity
    passed: bool


CheckFn = Callable[[ExtractedDocument, CheckContext], bool]
REGISTRY: dict[str, CheckFn] = {}


def register(code: str) -> Callable[[CheckFn], CheckFn]:
    """Decorator: bind a check function to its check code."""

    def wrap(fn: CheckFn) -> CheckFn:
        REGISTRY[code] = fn
        return fn

    return wrap


def _letters(text: str) -> str:
    return re.sub(r"[^a-z]", "", text.lower())


def _no_spaces(text: str) -> str:
    return re.sub(r"\s", "", text)


def names_match(a: str, b: str) -> bool:
    """Loose name match. TODO(PRD §5.2): swap for rapidfuzz + indic-transliteration (Hindi ⇄ Latin)."""
    return SequenceMatcher(None, _letters(a), _letters(b)).ratio() >= NAME_MATCH_MIN


@register("BILL_STAMP_MISSING")
def _stamp(d: ExtractedDocument, _c: CheckContext) -> bool:
    return d.has_stamp is True


@register("BILL_SIGNATURE_MISSING")
def _signature(d: ExtractedDocument, _c: CheckContext) -> bool:
    return d.has_signature is True


@register("DOCTOR_REG_MISSING")
def _doctor_reg(d: ExtractedDocument, _c: CheckContext) -> bool:
    return bool(d.doctor_reg_no and DOCTOR_REG_RE.match(d.doctor_reg_no.strip().upper()))


@register("PROVIDER_MISSING")
def _provider(d: ExtractedDocument, _c: CheckContext) -> bool:
    return bool(d.provider_name and d.provider_name.strip())


@register("PATIENT_NAME_MISMATCH")
def _patient(d: ExtractedDocument, c: CheckContext) -> bool:
    return bool(d.patient_name) and any(names_match(d.patient_name or "", n) for n in c.insured_names)


@register("BILL_DATE_OUTSIDE_POLICY")
def _bill_date(d: ExtractedDocument, c: CheckContext) -> bool:
    if not (d.bill_date and c.policy_start and c.policy_end):
        return False
    return c.policy_start <= d.bill_date <= c.policy_end


@register("BILL_NUMBER_MISSING")
def _bill_no(d: ExtractedDocument, _c: CheckContext) -> bool:
    return bool(d.bill_no and d.bill_no.strip())


@register("BILL_TOTAL_MISMATCH")
def _total(d: ExtractedDocument, _c: CheckContext) -> bool:
    return d.stated_total is not None and bool(d.items) and line_items_match_total(d.items, d.stated_total)


@register("LOW_LEGIBILITY")
def _legible(d: ExtractedDocument, _c: CheckContext) -> bool:
    return d.ocr_confidence >= LEGIBILITY_MIN


@register("DUPLICATE_BILL")
def _duplicate(d: ExtractedDocument, c: CheckContext) -> bool:
    return d.phash is None or d.phash not in c.other_phashes


@register("PHOTO_NOT_GEOTAGGED")
def _geotag(d: ExtractedDocument, _c: CheckContext) -> bool:
    return d.has_gps is True and d.is_inside_plot_area is not False


@register("PHOTO_OUTSIDE_72H")
def _photo_window(d: ExtractedDocument, c: CheckContext) -> bool:
    if not (d.photo_taken_at and c.event_at):
        return False
    return c.event_at <= d.photo_taken_at <= c.event_at + timedelta(hours=72)


@register("SURVEY_NO_MISMATCH")
def _survey(d: ExtractedDocument, c: CheckContext) -> bool:
    return bool(d.survey_no) and _no_spaces(d.survey_no or "") in {_no_spaces(s) for s in c.policy_survey_nos}


@register("LAND_NAME_MISMATCH")
def _land_name(d: ExtractedDocument, c: CheckContext) -> bool:
    return bool(d.land_owner_name) and any(names_match(d.land_owner_name or "", n) for n in c.insured_names)


@register("INTIMATION_LATE")
def _intimation(_d: ExtractedDocument, c: CheckContext) -> bool:
    if not (c.event_at and c.intimated_at):
        return False
    return c.intimated_at <= c.event_at + timedelta(hours=c.intimation_window_hours)


def run_checks(
    track: Track, checklist_item: str, doc: ExtractedDocument, ctx: CheckContext
) -> list[CheckOutcome]:
    """Run every check the track YAML lists for this checklist item."""
    specs = load_rules(track).checks.get(checklist_item, [])
    return [CheckOutcome(code=s.code, severity=s.severity, passed=REGISTRY[s.code](doc, ctx)) for s in specs]
