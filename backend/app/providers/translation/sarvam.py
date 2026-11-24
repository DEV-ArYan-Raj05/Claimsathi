"""TranslationProvider backed by Sarvam Translate (sarvam-translate:v1: English + 22 Indian languages)."""

import re

from sarvamai import AsyncSarvamAI

from app.providers.errors import ProviderError
from app.providers.sarvam import call_sarvam, request_options

# sarvam-translate:v1 takes up to 2,000 characters per request; leave headroom.
MAX_CHARS = 1800
# Language identification takes up to 1,000 characters.
DETECT_CHARS = 1000
_SENTENCE_END = re.compile(r"(?<=[.!?।॥])\s+")


def split_for_translation(text: str, limit: int = MAX_CHARS) -> list[str]:
    """Split on paragraphs, then sentences, then hard cuts, so each piece fits one request."""
    pieces: list[str] = []
    for paragraph in text.split("\n"):
        if len(paragraph) <= limit:
            pieces.append(paragraph)
            continue
        current = ""
        for sentence in _SENTENCE_END.split(paragraph):
            while len(sentence) > limit:
                pieces.append(sentence[:limit])
                sentence = sentence[limit:]
            if current and len(current) + 1 + len(sentence) > limit:
                pieces.append(current)
                current = sentence
            else:
                current = f"{current} {sentence}".strip()
        pieces.append(current)
    return pieces


class SarvamTranslationProvider:
    def __init__(
        self, client: AsyncSarvamAI, model: str, *, timeout_seconds: float, max_retries: int
    ) -> None:
        self._client = client
        self._model = model
        self._options = request_options(timeout_seconds, max_retries)

    async def _translate_piece(self, text: str, source: str, target: str) -> str:
        if not text.strip():
            return text
        response = await call_sarvam(
            lambda: self._client.text.translate(
                input=text,
                source_language_code=source,
                target_language_code=target,
                model=self._model,
                request_options=self._options,
            )
        )
        return str(response.translated_text)

    async def translate(self, text: str, source: str, target: str) -> str:
        """Translate line by line (keeps numbered steps on their own lines)."""
        if source == target:
            return text
        return "\n".join(
            [await self._translate_piece(p, source, target) for p in split_for_translation(text)]
        )

    async def detect(self, text: str) -> str | None:
        """Sarvam language identification; covers English + 10 Indic languages. None if unsure."""
        try:
            response = await call_sarvam(
                lambda: self._client.text.identify_language(
                    input=text[:DETECT_CHARS],
                    request_options=self._options,
                )
            )
        except ProviderError:
            return None
        return response.language_code or None
