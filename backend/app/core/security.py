"""Masking and signature helpers (PRD §7.2, rules.md §10)."""

import base64
import hashlib
import hmac
import re

AADHAAR_RE = re.compile(r"(?<!\d)(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})(?!\d)")


def mask_tail(value: str, visible: int = 4) -> str:
    """'PMFBY/HR/RBI/2026/7781245' → '••••1245'. Used in WhatsApp text, logs and UI."""
    compact = re.sub(r"\s", "", value)
    return f"••••{compact[-visible:]}"


def mask_aadhaar_text(text: str) -> str:
    """Replace any 12-digit Aadhaar pattern with XXXX XXXX + last 4 before text leaves our system."""
    return AADHAAR_RE.sub(lambda m: f"XXXX XXXX {m.group(3)}", text)


def verify_twilio_signature(auth_token: str, url: str, params: dict[str, str], signature: str) -> bool:
    """Twilio webhook signature: base64(HMAC-SHA1(token, url + sorted key/value pairs))."""
    payload = url + "".join(f"{k}{params[k]}" for k in sorted(params))
    digest = hmac.new(auth_token.encode(), payload.encode(), hashlib.sha1).digest()
    return hmac.compare_digest(base64.b64encode(digest).decode(), signature)
