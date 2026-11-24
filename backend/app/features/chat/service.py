"""The ClaimSathi assistant (PRD §3.6): user language → English → Sarvam chat → user language.

The chat model is never assumed to handle every Indian language: anything not in English is
translated to English first, answered in English with the grounded system prompt, checked, and
translated back.
"""

import logging
import time
from dataclasses import dataclass

from app.core.errors import AppError
from app.features.chat.knowledge import guard_answer, suggest_route, system_prompt
from app.features.chat.languages import ENGLISH, SUPPORTED_LANGUAGES
from app.features.chat.schemas import ChatRequest, ChatResponse
from app.features.chat.store import ConversationStore, RateLimiter
from app.providers.errors import ProviderError, ProviderErrorKind
from app.providers.llm.base import ChatProvider, ChatTurn
from app.providers.translation.base import TranslationProvider

log = logging.getLogger("claimsathi.chat")

HISTORY_TURNS = 12  # last 6 exchanges go to the model

# Provider failure → (code, HTTP status, message the user sees). No vendor detail leaks out.
_ERRORS: dict[ProviderErrorKind, tuple[str, int, str]] = {
    ProviderErrorKind.NOT_CONFIGURED: (
        "CHAT_NOT_CONFIGURED",
        503,
        "The assistant isn't set up on the server yet.",
    ),
    ProviderErrorKind.AUTH: ("CHAT_PROVIDER_AUTH", 502, "The assistant can't reach its language service."),
    ProviderErrorKind.CREDITS: ("CHAT_PROVIDER_CREDITS", 502, "The language service is out of credits."),
    ProviderErrorKind.RATE_LIMITED: ("CHAT_RATE_LIMITED", 429, "Too many questions. Wait a moment."),
    ProviderErrorKind.BAD_REQUEST: ("CHAT_BAD_REQUEST", 502, "The assistant couldn't handle that message."),
    ProviderErrorKind.UNAVAILABLE: ("CHAT_UNAVAILABLE", 503, "The assistant is busy. Try again shortly."),
    ProviderErrorKind.TIMEOUT: ("CHAT_TIMEOUT", 504, "The assistant took too long. Try again."),
    ProviderErrorKind.NETWORK: ("CHAT_UNREACHABLE", 503, "The assistant can't be reached right now."),
}


def to_app_error(err: ProviderError, step: str) -> AppError:
    """Map a provider failure to the API error shape (safe message, stable code)."""
    code, status, message = _ERRORS[err.kind]
    headers = {"Retry-After": str(err.retry_after)} if err.retry_after else None
    return AppError(code, message, status, details={"step": step}, headers=headers)


@dataclass
class ChatService:
    chat: ChatProvider
    translation: TranslationProvider
    store: ConversationStore
    limiter: RateLimiter

    async def _to_english(self, message: str, language: str) -> str:
        """English input passes through; anything else is translated (source = detected language)."""
        if language == ENGLISH:
            return message
        detected = await self.translation.detect(message)
        if detected == ENGLISH:
            return message
        source = detected if detected in SUPPORTED_LANGUAGES else language
        try:
            return await self.translation.translate(message, source, ENGLISH)
        except ProviderError as err:
            raise to_app_error(err, "translate_in") from None

    async def answer(self, user_id: str, req: ChatRequest) -> ChatResponse:
        """One turn: rate limit → own conversation → translate in → chat → guard → translate out."""
        wait = self.limiter.retry_after(user_id)
        if wait is not None:
            headers = {"Retry-After": str(wait)}
            raise AppError("CHAT_RATE_LIMITED", "Too many questions. Wait a moment.", 429, headers=headers)
        if req.conversation_id:
            convo = self.store.get(user_id, req.conversation_id)
            if convo is None:
                raise AppError("CONVERSATION_NOT_FOUND", "That conversation has ended. Start a new one.", 404)
        else:
            convo = self.store.create(user_id, req.track)
        started = time.monotonic()
        question_en = await self._to_english(req.message, req.language)
        messages: list[ChatTurn] = [
            {"role": "system", "content": system_prompt(req.track)},
            *convo.turns[-HISTORY_TURNS:],
            {"role": "user", "content": question_en},
        ]
        try:
            answer_en = guard_answer(await self.chat.chat(messages))
        except ProviderError as err:
            log.warning("chat failed", extra={"ids": _ids(user_id, convo.id, err)})
            raise to_app_error(err, "chat") from None
        reply = answer_en
        if req.language != ENGLISH:
            try:
                reply = await self.translation.translate(answer_en, ENGLISH, req.language)
            except ProviderError as err:
                log.warning("translate out failed", extra={"ids": _ids(user_id, convo.id, err)})
                raise to_app_error(err, "translate_out") from None
        convo.add(question_en, answer_en)
        intent, route = suggest_route([req.message, question_en], req.track)
        ms = int((time.monotonic() - started) * 1000)
        ids = {"user_id": user_id, "conversation_id": convo.id, "language": req.language, "ms": ms}
        log.info("chat answered", extra={"ids": ids})
        return ChatResponse(
            conversation_id=convo.id,
            reply=reply,
            reply_en=answer_en,
            language=req.language,
            translated=req.language != ENGLISH,
            intent=intent,
            route=route,
        )


def _ids(user_id: str, conversation_id: str, err: ProviderError) -> dict[str, object]:
    """IDs and error facts only — never message text or keys (rules.md §10)."""
    return {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "kind": err.kind.value,
        "status": err.status,
        "vendor_code": err.vendor_code,
    }
