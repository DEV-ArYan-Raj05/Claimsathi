"""POST /webhooks/whatsapp — Twilio status callbacks and inbound replies, signature-verified."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import verify_twilio_signature
from app.features.whatsapp.service import InboundAction, parse_inbound

router = APIRouter(tags=["whatsapp"])


class WebhookAck(BaseModel):
    action: InboundAction | None


@router.post("/webhooks/whatsapp", response_model=WebhookAck)
async def whatsapp_webhook(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    x_twilio_signature: Annotated[str, Header()] = "",
) -> WebhookAck:
    """Verify Twilio's signature, then classify the reply."""
    form = {k: str(v) for k, v in (await request.form()).items()}
    if not verify_twilio_signature(settings.twilio_auth_token, str(request.url), form, x_twilio_signature):
        raise AppError("SIGNATURE_INVALID", "Signature check failed.", 403)
    if "Body" not in form:
        # TODO(PRD §3.8): store delivery status (MessageStatus) in whatsapp_messages.
        return WebhookAck(action=None)
    # TODO(PRD §3.8): STOP sets profiles.whatsapp_opt_in=false; STATUS replies with latest stage.
    return WebhookAck(action=parse_inbound(form["Body"]))
