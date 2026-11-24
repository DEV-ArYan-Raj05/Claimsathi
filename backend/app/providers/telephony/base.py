"""Telephony interface (Twilio: calls, SMS, WhatsApp). PRD §3.6, rules.md §12."""

from typing import Protocol


class TelephonyProvider(Protocol):
    async def send_whatsapp(self, to: str, template_sid: str, variables: dict[str, str]) -> str:
        """Send an approved template; returns the provider message id."""
        ...

    async def send_sms(self, to: str, body: str) -> str:
        """SMS fallback when WhatsApp fails."""
        ...

    async def call(self, to: str, tts_text: str, lang: str) -> str:
        """Outbound reminder call; returns the provider call id."""
        ...
