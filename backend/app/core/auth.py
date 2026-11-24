"""Verify the Supabase JWT on every request (rules.md §8, PRD §3.7). No custom auth logic beyond this.

Supabase signs access tokens with the project's asymmetric signing key (ES256 or RS256) and publishes
the public keys at {SUPABASE_URL}/auth/v1/.well-known/jwks.json — the recommended way to verify.
Projects still on the legacy shared secret sign with HS256; that path works while
SUPABASE_JWT_SECRET is set. Either way we check signature, expiry, audience and issuer.
"""

from functools import cache
from typing import Annotated, Any

import jwt
from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.errors import AppError

AUDIENCE = "authenticated"
ASYMMETRIC_ALGORITHMS = ["ES256", "RS256"]
JWKS_CACHE_SECONDS = 600


def _invalid() -> AppError:
    return AppError("AUTH_INVALID", "Your session has expired. Sign in again.", 401)


@cache
def jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    """One cached key set per project; keys refresh after JWKS_CACHE_SECONDS or on an unknown kid."""
    return jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=JWKS_CACHE_SECONDS)


def _issuer(settings: Settings) -> str | None:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None


def _verification_key(token: str, alg: str, settings: Settings) -> tuple[Any, list[str]]:
    """Pick the key by the token's algorithm, never letting an HS token use a public key."""
    issuer = _issuer(settings)
    if alg in ASYMMETRIC_ALGORITHMS:
        if issuer is None:
            raise AppError("AUTH_NOT_CONFIGURED", "Sign-in isn't set up on the server.", 500)
        try:
            key = jwks_client(f"{issuer}/.well-known/jwks.json").get_signing_key_from_jwt(token)
        except jwt.PyJWKClientConnectionError as exc:
            raise AppError("AUTH_UNAVAILABLE", "Can't check your sign-in right now. Try again.", 503) from exc
        except jwt.PyJWTError as exc:
            raise _invalid() from exc
        return key.key, ASYMMETRIC_ALGORITHMS
    if alg == "HS256" and settings.supabase_jwt_secret:
        return settings.supabase_jwt_secret, ["HS256"]
    raise _invalid()


def decode_supabase_jwt(token: str, settings: Settings) -> dict[str, Any]:
    """Return the verified claims of a Supabase access token, or raise AUTH_INVALID."""
    try:
        alg = str(jwt.get_unverified_header(token).get("alg", ""))
    except jwt.PyJWTError as exc:
        raise _invalid() from exc
    key, algorithms = _verification_key(token, alg, settings)
    issuer = _issuer(settings)
    try:
        claims: dict[str, Any] = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience=AUDIENCE,
            issuer=issuer,
            options={"require": ["exp", "sub", "aud"], "verify_iss": issuer is not None},
        )
    except jwt.PyJWTError as exc:
        raise _invalid() from exc
    return claims


def current_user_id(
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: Annotated[str, Header()] = "",
) -> str:
    """Return the Supabase user id (`sub`) from a valid Bearer token."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError("AUTH_REQUIRED", "Sign in to continue.", 401)
    return str(decode_supabase_jwt(token.strip(), settings)["sub"])
