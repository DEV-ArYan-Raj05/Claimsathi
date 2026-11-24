"""Translation interface (PRD §3.6: Hindi + English for the demo, 22 Indian languages as the goal)."""

from typing import Protocol


class TranslationProvider(Protocol):
    async def translate(self, text: str, source: str, target: str) -> str:
        """Translate between BCP-47 codes such as hi-IN and en-IN. Raises ProviderError."""
        ...

    async def detect(self, text: str) -> str | None:
        """Best-effort language code of `text` (e.g. en-IN), or None when unsure."""
        ...
