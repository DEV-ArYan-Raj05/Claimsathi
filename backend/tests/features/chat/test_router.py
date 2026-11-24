"""POST /api/v1/chat over HTTP: Supabase JWT required, validation shape, user isolation."""

import time
from collections.abc import Iterator

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.features.chat.router import get_chat_service
from app.features.chat.service import ChatService
from app.features.chat.store import ConversationStore, RateLimiter
from app.main import app
from app.providers.llm.fake import FakeChatProvider
from app.providers.translation.fake import FakeTranslationProvider

SECRET = "router-test-secret-at-least-32-characters"  # noqa: S105 (test-only value)
URL = "https://demo-ref.supabase.co"


def token(sub: str) -> str:
    claims = {"sub": sub, "aud": "authenticated", "iss": f"{URL}/auth/v1", "exp": int(time.time()) + 60}
    return jwt.encode(claims, SECRET, algorithm="HS256")


@pytest.fixture
def client() -> Iterator[TestClient]:
    svc = ChatService(
        chat=FakeChatProvider(["Upload the signed claim form."]),
        translation=FakeTranslationProvider(detected="hi-IN"),
        store=ConversationStore(),
        limiter=RateLimiter(50),
    )
    app.dependency_overrides[get_settings] = lambda: Settings(supabase_url=URL, supabase_jwt_secret=SECRET)
    app.dependency_overrides[get_chat_service] = lambda: svc
    yield TestClient(app)
    app.dependency_overrides.clear()


def post(client: TestClient, body: dict[str, object], user: str | None = "user-a") -> tuple[int, dict]:
    headers = {"Authorization": f"Bearer {token(user)}"} if user else {}
    res = client.post("/api/v1/chat", json=body, headers=headers)
    return res.status_code, res.json()


def test_unauthenticated_requests_are_rejected(client: TestClient) -> None:
    status, body = post(client, {"message": "hi", "track": "health"}, user=None)
    assert status == 401 and body["error"]["code"] == "AUTH_REQUIRED"
    res = client.post(
        "/api/v1/chat", json={"message": "hi", "track": "health"}, headers={"Authorization": "Bearer x"}
    )
    assert res.status_code == 401 and res.json()["error"]["code"] == "AUTH_INVALID"


def test_english_and_hindi_round_trip(client: TestClient) -> None:
    status, body = post(client, {"message": "Which documents?", "track": "health"})
    assert status == 200 and body["reply"] == "Upload the signed claim form." and not body["translated"]
    status, body = post(client, {"message": "कौन से दस्तावेज़?", "track": "crop", "language": "hi-IN"})
    assert status == 200 and body["reply"].startswith("[hi-IN]") and body["route"] == "/crop/claims"


@pytest.mark.parametrize(
    "bad",
    [
        {"message": "   ", "track": "health"},
        {"message": "", "track": "health"},
        {"message": "x" * 1001, "track": "health"},
        {"message": "hi", "track": "motor"},
        {"message": "hi", "track": "health", "language": "fr-FR"},
        {"message": "hi", "track": "health", "conversation_id": "../../etc"},
    ],
)
def test_invalid_messages_use_the_error_shape(client: TestClient, bad: dict[str, object]) -> None:
    status, body = post(client, bad)
    assert status == 422 and body["error"]["code"] == "VALIDATION_ERROR"
    assert "x" * 50 not in str(body)  # submitted text is never echoed back


def test_other_users_conversation_is_not_found(client: TestClient) -> None:
    _, mine = post(client, {"message": "hello", "track": "health"}, user="user-a")
    status, body = post(
        client, {"message": "show", "track": "health", "conversation_id": mine["conversation_id"]}, "user-b"
    )
    assert status == 404 and body["error"]["code"] == "CONVERSATION_NOT_FOUND"
    status, _ = post(
        client, {"message": "more", "track": "health", "conversation_id": mine["conversation_id"]}, "user-a"
    )
    assert status == 200


def test_without_a_sarvam_key_the_endpoint_says_so() -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=URL, supabase_jwt_secret=SECRET, sarvam_api_key=""
    )
    try:
        res = TestClient(app).post(
            "/api/v1/chat",
            json={"message": "hi", "track": "health"},
            headers={"Authorization": f"Bearer {token('user-a')}"},
        )
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 503 and res.json()["error"]["code"] == "CHAT_NOT_CONFIGURED"


def test_a_slow_turn_ends_with_a_clean_timeout() -> None:
    slow = ChatService(
        chat=FakeChatProvider(delay=1.0),
        translation=FakeTranslationProvider(),
        store=ConversationStore(),
        limiter=RateLimiter(50),
    )
    settings = Settings(supabase_url=URL, supabase_jwt_secret=SECRET, chat_request_timeout_seconds=0.05)
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_chat_service] = lambda: slow
    try:
        res = TestClient(app).post(
            "/api/v1/chat",
            json={"message": "hi", "track": "health"},
            headers={"Authorization": f"Bearer {token('user-a')}"},
        )
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 504 and res.json()["error"]["code"] == "CHAT_TIMEOUT"
