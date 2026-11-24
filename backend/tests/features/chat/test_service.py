"""Assistant flow with fake providers: languages, context, isolation, guard rails, errors."""

import asyncio

import pytest

from app.core.errors import AppError
from app.features.chat.knowledge import NO_PROMISE_NOTE, system_prompt
from app.features.chat.schemas import ChatRequest
from app.features.chat.service import ChatService
from app.features.chat.store import ConversationStore, RateLimiter
from app.providers.errors import ProviderError, ProviderErrorKind
from app.providers.llm.fake import FakeChatProvider
from app.providers.translation.fake import FakeTranslationProvider
from app.rules.loader import Track

A, B = "user-a", "user-b"


def service(
    replies: list[str] | None = None,
    detected: str | None = None,
    chat_error: ProviderError | None = None,
    per_minute: int = 50,
) -> ChatService:
    return ChatService(
        chat=FakeChatProvider(replies, error=chat_error),
        translation=FakeTranslationProvider(detected=detected),
        store=ConversationStore(),
        limiter=RateLimiter(per_minute),
    )


def ask(svc: ChatService, user: str, message: str, **kw: object) -> object:
    req = ChatRequest.model_validate({"message": message, "track": "health", **kw})
    return asyncio.run(svc.answer(user, req))


def test_english_conversation_needs_no_translation() -> None:
    svc = service(["Upload the signed claim form."])
    r = ask(svc, A, "Which documents do I need?")
    assert r.reply == "Upload the signed claim form." and r.translated is False
    assert svc.translation.calls == []  # type: ignore[attr-defined]
    sent = svc.chat.calls[0]  # type: ignore[attr-defined]
    assert sent[0]["role"] == "system" and "ClaimSathi assistant" in sent[0]["content"]
    assert sent[-1] == {"role": "user", "content": "Which documents do I need?"}


def test_hindi_is_translated_in_and_out() -> None:
    svc = service(["Report it within 48 hours."], detected="hi-IN")
    r = ask(svc, A, "मुझे कब बताना है?", language="hi-IN")
    calls = svc.translation.calls  # type: ignore[attr-defined]
    assert calls[0] == ("मुझे कब बताना है?", "hi-IN", "en-IN")
    assert calls[1] == ("Report it within 48 hours.", "en-IN", "hi-IN")
    assert svc.chat.calls[0][-1]["content"] == "[en-IN] मुझे कब बताना है?"  # type: ignore[attr-defined]
    assert r.reply == "[hi-IN] Report it within 48 hours."
    assert r.reply_en == "Report it within 48 hours." and r.translated is True


def test_english_typed_with_another_language_selected_skips_input_translation() -> None:
    svc = service(["Answer."], detected="en-IN")
    r = ask(svc, A, "Where is my claim?", language="ta-IN")
    assert svc.translation.calls == [("Answer.", "en-IN", "ta-IN")]  # type: ignore[attr-defined]
    assert r.reply == "[ta-IN] Answer."


def test_uses_detected_language_as_source_when_it_differs() -> None:
    svc = service(["Answer."], detected="hi-IN")
    ask(svc, A, "मेरा क्लेम", language="mr-IN")
    assert svc.translation.calls[0][1] == "hi-IN"  # type: ignore[attr-defined]


def test_later_messages_carry_earlier_turns() -> None:
    svc = service(["First answer.", "Second answer."])
    first = ask(svc, A, "What is a waiting period?")
    ask(svc, A, "And for accidents?", conversation_id=first.conversation_id)
    history = svc.chat.calls[1]  # type: ignore[attr-defined]
    assert [m["content"] for m in history[1:]] == [
        "What is a waiting period?",
        "First answer.",
        "And for accidents?",
    ]


def test_conversations_are_isolated_between_users() -> None:
    svc = service()
    mine = ask(svc, A, "Hello")
    with pytest.raises(AppError) as exc:
        ask(svc, B, "Show me", conversation_id=mine.conversation_id)
    assert exc.value.code == "CONVERSATION_NOT_FOUND" and exc.value.status == 404
    assert len(svc.chat.calls) == 1  # type: ignore[attr-defined]  # B's request never reached the model


def test_never_promises_approval() -> None:
    svc = service(["Your claim will definitely be approved."])
    assert NO_PROMISE_NOTE in ask(svc, A, "Will I get paid?").reply


def test_suggests_the_matching_screen() -> None:
    r = ask(service(), A, "Where is my claim?")
    assert (r.intent, r.route) == ("claim_status", "/health/claims")
    assert ask(service(), A, "What is a TPA?").route is None


@pytest.mark.parametrize(
    ("kind", "code", "status"),
    [
        (ProviderErrorKind.AUTH, "CHAT_PROVIDER_AUTH", 502),
        (ProviderErrorKind.RATE_LIMITED, "CHAT_RATE_LIMITED", 429),
        (ProviderErrorKind.NETWORK, "CHAT_UNREACHABLE", 503),
        (ProviderErrorKind.TIMEOUT, "CHAT_TIMEOUT", 504),
        (ProviderErrorKind.CREDITS, "CHAT_PROVIDER_CREDITS", 502),
    ],
)
def test_provider_failures_become_safe_errors(kind: ProviderErrorKind, code: str, status: int) -> None:
    err = ProviderError(kind, status=403, vendor_code="invalid_api_key_error", retry_after=7)
    with pytest.raises(AppError) as exc:
        ask(service(chat_error=err), A, "Hi")
    assert (exc.value.code, exc.value.status) == (code, status)
    assert "invalid_api_key_error" not in exc.value.message
    assert exc.value.headers.get("Retry-After") == "7"


def test_per_user_rate_limit() -> None:
    svc = service(per_minute=2)
    ask(svc, A, "one")
    ask(svc, A, "two")
    with pytest.raises(AppError) as exc:
        ask(svc, A, "three")
    assert exc.value.code == "CHAT_RATE_LIMITED" and "Retry-After" in exc.value.headers
    ask(svc, B, "other users are unaffected")


def test_prompts_are_grounded_in_track_rules() -> None:
    crop, health = system_prompt(Track.CROP), system_prompt(Track.HEALTH)
    assert "within 72 hours" in crop and "Geotagged photos" in crop and "14447" in crop
    assert "within 30 days" in health and "Discharge summary" in health
    for p in (crop, health):
        assert "Never say or suggest that a claim will be approved" in p
        assert "cannot see this user's policy, claims" in p
