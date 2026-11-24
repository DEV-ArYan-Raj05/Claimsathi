"""Supabase JWT verification: asymmetric (JWKS) and legacy HS256 paths, and the failure cases."""

import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core import auth
from app.core.config import Settings
from app.core.errors import AppError

URL = "https://demo-ref.supabase.co"
ISSUER = f"{URL}/auth/v1"
SECRET = "test-legacy-secret-with-at-least-32-chars!"  # noqa: S105 (test-only value)
USER = "11111111-1111-1111-1111-111111111111"
EC_KEY = ec.generate_private_key(ec.SECP256R1())
OTHER_EC_KEY = ec.generate_private_key(ec.SECP256R1())


def claims(**overrides: Any) -> dict[str, Any]:
    base = {"sub": USER, "aud": "authenticated", "iss": ISSUER, "exp": int(time.time()) + 300}
    base.update(overrides)
    return {k: v for k, v in base.items() if v is not None}


def es256(payload: dict[str, Any], key: ec.EllipticCurvePrivateKey = EC_KEY) -> str:
    return jwt.encode(payload, key, algorithm="ES256", headers={"kid": "k1"})


class FakeJwks:
    """Stands in for PyJWKClient: always returns the test project's public key."""

    def get_signing_key_from_jwt(self, _token: str) -> jwt.PyJWK:
        return jwt.PyJWK.from_dict(
            {**jwt.algorithms.ECAlgorithm.to_jwk(EC_KEY.public_key(), as_dict=True), "kid": "k1"},
            algorithm="ES256",
        )


@pytest.fixture(autouse=True)
def fake_jwks(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "jwks_client", lambda _url: FakeJwks())


def settings(secret: str = "") -> Settings:
    return Settings(supabase_url=URL, supabase_jwt_secret=secret)


def user_id(token: str, s: Settings | None = None) -> str:
    return auth.current_user_id(s or settings(), f"Bearer {token}")


def error_code(token: str, s: Settings | None = None) -> str:
    with pytest.raises(AppError) as exc:
        user_id(token, s)
    return exc.value.code


def test_es256_token_from_project_key_is_accepted() -> None:
    assert user_id(es256(claims())) == USER


def test_legacy_hs256_token_is_accepted_when_secret_set() -> None:
    token = jwt.encode(claims(), SECRET, algorithm="HS256")
    assert user_id(token, settings(SECRET)) == USER


def test_hs256_rejected_without_secret() -> None:
    assert error_code(jwt.encode(claims(), SECRET, algorithm="HS256")) == "AUTH_INVALID"


@pytest.mark.parametrize(
    "bad",
    [
        claims(exp=int(time.time()) - 10),  # expired
        claims(aud="anon"),  # wrong audience
        claims(iss="https://evil.supabase.co/auth/v1"),  # another project
        claims(sub=None),  # no user
    ],
)
def test_invalid_claims_are_rejected(bad: dict[str, Any]) -> None:
    assert error_code(es256(bad)) == "AUTH_INVALID"


def test_token_signed_by_another_key_is_rejected() -> None:
    assert error_code(es256(claims(), OTHER_EC_KEY)) == "AUTH_INVALID"


def test_unsigned_and_garbage_tokens_are_rejected() -> None:
    unsigned = jwt.encode(claims(), None, algorithm="none")
    assert error_code(unsigned, settings(SECRET)) == "AUTH_INVALID"
    assert error_code("not-a-jwt") == "AUTH_INVALID"


def test_missing_or_non_bearer_header() -> None:
    for header in ["", "Basic abc", "Bearer "]:
        with pytest.raises(AppError) as exc:
            auth.current_user_id(settings(), header)
        assert exc.value.code == "AUTH_REQUIRED"
        assert exc.value.status == 401


def test_asymmetric_token_needs_supabase_url() -> None:
    with pytest.raises(AppError) as exc:
        auth.current_user_id(Settings(supabase_url=""), f"Bearer {es256(claims())}")
    assert exc.value.code == "AUTH_NOT_CONFIGURED"
