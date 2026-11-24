"""Fake TranslationProvider: tags text with the target language so tests can see each hop."""

from app.providers.errors import ProviderError


class FakeTranslationProvider:
    def __init__(self, detected: str | None = None, error: ProviderError | None = None) -> None:
        self.detected = detected
        self.error = error
        self.calls: list[tuple[str, str, str]] = []

    async def translate(self, text: str, source: str, target: str) -> str:
        """'[hi-IN] <text>' style output; raises the configured error if any."""
        self.calls.append((text, source, target))
        if self.error:
            raise self.error
        return text if source == target else f"[{target}] {text}"

    async def detect(self, text: str) -> str | None:
        """Return the configured language code."""
        return self.detected
