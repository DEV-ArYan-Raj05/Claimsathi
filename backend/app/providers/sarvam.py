"""Shared Sarvam AI plumbing: one async client and one error mapping for the Sarvam adapters.

The official SDK sends the key in the `api-subscription-key` header. The key comes from
SARVAM_API_KEY (backend/.env) only, is never logged, and never leaves the backend.
"""

from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

import httpx
from sarvamai import AsyncSarvamAI
from sarvamai.core.api_error import ApiError

from app.providers.errors import ProviderError, ProviderErrorKind

T = TypeVar("T")


def make_client(
    api_key: str, timeout_seconds: float, httpx_client: httpx.AsyncClient | None = None
) -> AsyncSarvamAI:
    """Async Sarvam client. Pass `httpx_client` only in tests (mock transport)."""
    if not api_key:
        raise ProviderError(ProviderErrorKind.NOT_CONFIGURED)
    if httpx_client is not None:
        return AsyncSarvamAI(api_subscription_key=api_key, httpx_client=httpx_client)
    return AsyncSarvamAI(api_subscription_key=api_key, timeout=timeout_seconds)


def _vendor_code(body: Any) -> str | None:
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict) and isinstance(err.get("code"), str):
            return str(err["code"])
    return None


def _retry_after(headers: dict[str, str] | None) -> int | None:
    value = {k.lower(): v for k, v in (headers or {}).items()}.get("retry-after")
    return int(value) if value and value.isdigit() else None


def map_api_error(err: ApiError) -> ProviderError:
    """Sarvam HTTP errors → ProviderError (docs.sarvam.ai: Errors & troubleshooting)."""
    status = err.status_code
    code = _vendor_code(err.body)
    if status in (401, 403):
        kind = ProviderErrorKind.AUTH
    elif status == 402 or code == "seat_budget_exhausted_error":
        kind = ProviderErrorKind.CREDITS
    elif status == 429:
        kind = ProviderErrorKind.RATE_LIMITED
    elif status in (400, 404, 413, 422):
        kind = ProviderErrorKind.BAD_REQUEST
    elif status == 408:
        kind = ProviderErrorKind.TIMEOUT
    else:
        kind = ProviderErrorKind.UNAVAILABLE
    return ProviderError(kind, status=status, vendor_code=code, retry_after=_retry_after(err.headers))


async def call_sarvam(fn: Callable[[], Awaitable[T]]) -> T:
    """Run one SDK call, turning every failure into a ProviderError (no SDK types escape)."""
    try:
        return await fn()
    except ApiError as err:
        raise map_api_error(err) from None
    except httpx.TimeoutException:
        raise ProviderError(ProviderErrorKind.TIMEOUT) from None
    except httpx.HTTPError:
        raise ProviderError(ProviderErrorKind.NETWORK) from None


def request_options(timeout_seconds: float, max_retries: int) -> dict[str, Any]:
    """Per-call timeout and retries. The SDK retries 408/409/429/5xx with backoff + Retry-After."""
    return {"timeout_in_seconds": int(timeout_seconds), "max_retries": max_retries}
