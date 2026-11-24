"""Vendor-neutral provider failures. Features map these to API errors; vendor SDK errors stop here."""

from enum import StrEnum


class ProviderErrorKind(StrEnum):
    NOT_CONFIGURED = "not_configured"  # no API key set
    AUTH = "auth"  # key missing, wrong or revoked
    CREDITS = "credits"  # out of credits / budget: waiting won't help
    RATE_LIMITED = "rate_limited"  # too many requests: retry after a pause
    BAD_REQUEST = "bad_request"  # we sent something the vendor rejected
    UNAVAILABLE = "unavailable"  # vendor down, overloaded or returned nothing usable
    TIMEOUT = "timeout"
    NETWORK = "network"  # couldn't reach the vendor at all


class ProviderError(Exception):
    """Carries only safe facts (kind, HTTP status, vendor error code) — never keys or user text."""

    def __init__(
        self,
        kind: ProviderErrorKind,
        *,
        status: int | None = None,
        vendor_code: str | None = None,
        retry_after: int | None = None,
    ) -> None:
        super().__init__(f"{kind.value} (status={status}, code={vendor_code})")
        self.kind = kind
        self.status = status
        self.vendor_code = vendor_code
        self.retry_after = retry_after
