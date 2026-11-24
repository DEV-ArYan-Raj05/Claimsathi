"""POST /api/v1/chat — the in-app assistant (PRD §3.6). Supabase JWT required (core/auth.py)."""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import current_user_id
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.features.chat.schemas import ChatRequest, ChatResponse
from app.features.chat.service import ChatService, to_app_error
from app.features.chat.store import ConversationStore, RateLimiter
from app.providers.errors import ProviderError
from app.providers.llm.sarvam import SarvamChatProvider
from app.providers.sarvam import make_client
from app.providers.translation.sarvam import SarvamTranslationProvider

router = APIRouter(prefix="/api/v1", tags=["chat"])


_services: dict[int, ChatService] = {}


def _build(settings: Settings) -> ChatService:
    client = make_client(settings.sarvam_api_key.get_secret_value(), settings.sarvam_timeout_seconds)
    timeout, retries = settings.sarvam_timeout_seconds, settings.sarvam_max_retries
    return ChatService(
        chat=SarvamChatProvider(
            client, settings.sarvam_chat_model, timeout_seconds=timeout, max_retries=retries
        ),
        translation=SarvamTranslationProvider(
            client, settings.sarvam_translate_model, timeout_seconds=timeout, max_retries=retries
        ),
        store=ConversationStore(),
        limiter=RateLimiter(settings.chat_messages_per_minute),
    )


def get_chat_service(settings: Annotated[Settings, Depends(get_settings)]) -> ChatService:
    """One service per process (keeps conversations); 503 CHAT_NOT_CONFIGURED without a key."""
    try:
        if id(settings) not in _services:
            _services[id(settings)] = _build(settings)
        return _services[id(settings)]
    except ProviderError as err:
        raise to_app_error(err, "setup") from None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user_id: Annotated[str, Depends(current_user_id)],
    service: Annotated[ChatService, Depends(get_chat_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatResponse:
    """Answer one message in the user's language, continuing their own conversation."""
    try:
        return await asyncio.wait_for(service.answer(user_id, body), settings.chat_request_timeout_seconds)
    except TimeoutError:
        raise AppError("CHAT_TIMEOUT", "The assistant took too long. Try again.", 504) from None
