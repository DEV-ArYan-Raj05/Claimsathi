"""
WhatsApp claim updates (PRD §3.8): template variables only, masked policy numbers, quiet hours
21:00-08:00 IST except crop 72-hour alerts, idempotency key = stage_id + kind.
"""

from datetime import datetime, time
from enum import StrEnum
from zoneinfo import ZoneInfo

from pydantic import BaseModel

from app.core.security import mask_tail

IST = ZoneInfo("Asia/Kolkata")
QUIET_START, QUIET_END = time(21, 0), time(8, 0)
QUIET_EXEMPT = {"deadline_countdown"}  # crop 72-hour deadline alerts


class InboundAction(StrEnum):
    STATUS = "status"
    STOP = "stop"
    HELP = "help"
    UNKNOWN = "unknown"


class OutboundMessage(BaseModel):
    template_name: str
    idempotency_key: str
    variables: dict[str, str]


def is_quiet_hours(at: datetime, template_name: str) -> bool:
    """True when a business-initiated message must wait until 08:00 IST."""
    if template_name in QUIET_EXEMPT:
        return False
    local = at.astimezone(IST).time()
    return local >= QUIET_START or local < QUIET_END


def stage_changed_message(stage_id: str, policy_no: str, stage: str, next_date: str) -> OutboundMessage:
    """Build the 'stage changed' template call. Never carries documents, diagnosis or bank details."""
    return OutboundMessage(
        template_name="stage_changed",
        idempotency_key=f"{stage_id}:stage_changed",
        variables={"ref": mask_tail(policy_no), "stage": stage, "date": next_date},
    )


def parse_inbound(body: str) -> InboundAction:
    """Map an inbound reply to STATUS / STOP / HELP (STOP opts out immediately)."""
    word = body.strip().split(maxsplit=1)[0].upper() if body.strip() else ""
    keywords = {"STATUS": InboundAction.STATUS, "STOP": InboundAction.STOP, "HELP": InboundAction.HELP}
    return keywords.get(word, InboundAction.UNKNOWN)
