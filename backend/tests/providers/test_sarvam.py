"""The real Sarvam SDK over a mocked network: request shape, key header, and error mapping."""

import asyncio
import json
import logging
from collections.abc import Callable

import httpx
import pytest
from sarvamai import AsyncSarvamAI

from app.providers.errors import ProviderError, ProviderErrorKind
from app.providers.llm.base import ChatTurn
from app.providers.llm.sarvam import SarvamChatProvider
from app.providers.sarvam import make_client
from app.providers.translation.sarvam import SarvamTranslationProvider, split_for_translation

KEY = "sk_test_never_printed_0123456789"
seen: list[httpx.Request] = []


def client_with(handler: Callable[[httpx.Request], httpx.Response]) -> AsyncSarvamAI:
    def record(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return handler(request)

    return make_client(KEY, 5, httpx_client=httpx.AsyncClient(transport=httpx.MockTransport(record)))


def chat_provider(handler: Callable[[httpx.Request], httpx.Response]) -> SarvamChatProvider:
    return SarvamChatProvider(client_with(handler), "sarvam-105b", timeout_seconds=5, max_retries=0)


def translator(handler: Callable[[httpx.Request], httpx.Response]) -> SarvamTranslationProvider:
    client = client_with(handler)
    return SarvamTranslationProvider(client, "sarvam-translate:v1", timeout_seconds=5, max_retries=0)


def err(status: int, code: str, **headers: str) -> httpx.Response:
    return httpx.Response(status, json={"error": {"code": code}}, headers=headers)


def completion(text: str) -> httpx.Response:
    choice = {"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": text}}
    body = {
        "id": "c1",
        "object": "chat.completion",
        "created": 1,
        "model": "sarvam-105b",
        "choices": [choice],
    }
    return httpx.Response(200, json=body)


def run(coro: object) -> object:
    return asyncio.run(coro)  # type: ignore[arg-type]


def test_chat_request_shape_and_auth_header() -> None:
    seen.clear()
    provider = chat_provider(lambda _r: completion("<think>x</think> Upload the bills."))
    turns: list[ChatTurn] = [
        {"role": "system", "content": "sys"},
        {"role": "user", "content": "Which documents?"},
    ]
    answer = run(provider.chat(turns))
    assert answer == "Upload the bills."
    req = seen[0]
    assert req.url.path.endswith("/v1/chat/completions")
    assert req.headers["api-subscription-key"] == KEY
    body = json.loads(req.content)
    assert body["model"] == "sarvam-105b" and body["messages"][-1]["content"] == "Which documents?"


@pytest.mark.parametrize(
    ("response", "kind"),
    [
        (err(403, "invalid_api_key_error"), ProviderErrorKind.AUTH),
        (err(429, "rate_limit_exceeded_error", **{"Retry-After": "9"}), ProviderErrorKind.RATE_LIMITED),
        (err(429, "seat_budget_exhausted_error"), ProviderErrorKind.CREDITS),
        (err(402, "insufficient_credits"), ProviderErrorKind.CREDITS),
        (err(503, "model_overloaded"), ProviderErrorKind.UNAVAILABLE),
        (err(400, "invalid_request_error"), ProviderErrorKind.BAD_REQUEST),
        (completion(""), ProviderErrorKind.UNAVAILABLE),
    ],
)
def test_http_errors_map_to_provider_errors(response: httpx.Response, kind: ProviderErrorKind) -> None:
    with pytest.raises(ProviderError) as exc:
        run(chat_provider(lambda _r: response).chat([{"role": "user", "content": "hi"}]))
    assert exc.value.kind is kind
    if response.status_code == 429 and kind is ProviderErrorKind.RATE_LIMITED:
        assert exc.value.retry_after == 9


@pytest.mark.parametrize(
    ("exc_type", "kind"),
    [(httpx.ConnectError, ProviderErrorKind.NETWORK), (httpx.ReadTimeout, ProviderErrorKind.TIMEOUT)],
)
def test_network_failures(exc_type: type[httpx.HTTPError], kind: ProviderErrorKind) -> None:
    def fail(request: httpx.Request) -> httpx.Response:
        raise exc_type("boom", request=request)

    with pytest.raises(ProviderError) as exc:
        run(chat_provider(fail).chat([{"role": "user", "content": "hi"}]))
    assert exc.value.kind is kind


def test_missing_key_is_not_configured() -> None:
    with pytest.raises(ProviderError) as exc:
        make_client("", 5)
    assert exc.value.kind is ProviderErrorKind.NOT_CONFIGURED


def test_translate_and_detect_requests() -> None:
    seen.clear()

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        if request.url.path.endswith("/text-lid"):
            return httpx.Response(200, json={"language_code": "hi-IN", "script_code": "Deva"})
        translated = {"translated_text": f"T({body['input']})", "source_language_code": "en-IN"}
        return httpx.Response(200, json=translated)

    provider = translator(handler)
    assert run(provider.detect("नमस्ते")) == "hi-IN"
    assert run(provider.translate("Line one.\nLine two.", "en-IN", "ta-IN")) == "T(Line one.)\nT(Line two.)"
    body = json.loads(seen[-1].content)
    sent = (body["source_language_code"], body["target_language_code"], body["model"])
    assert sent == ("en-IN", "ta-IN", "sarvam-translate:v1")
    assert all(r.headers["api-subscription-key"] == KEY for r in seen)


def test_detect_failure_is_treated_as_unknown() -> None:
    assert run(translator(lambda _r: httpx.Response(503, json={})).detect("x")) is None


def test_long_text_is_split_under_the_limit() -> None:
    text = ("This is a sentence. " * 200).strip()
    pieces = split_for_translation(text, limit=500)
    assert all(len(p) <= 500 for p in pieces) and " ".join(pieces).replace("  ", " ") == text


def test_key_never_appears_in_errors_or_logs(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.DEBUG)
    with pytest.raises(ProviderError) as exc:
        run(
            chat_provider(lambda _r: err(403, "invalid_api_key_error")).chat(
                [{"role": "user", "content": "x"}]
            )
        )
    assert KEY not in str(exc.value) and KEY not in repr(exc.value)
    assert KEY not in caplog.text
