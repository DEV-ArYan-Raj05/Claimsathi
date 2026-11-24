"""ChatProvider backed by Sarvam chat completions (model from SARVAM_CHAT_MODEL, e.g. sarvam-105b)."""

import re
from collections.abc import Sequence

from sarvamai import AsyncSarvamAI

from app.providers.errors import ProviderError, ProviderErrorKind
from app.providers.llm.base import ChatTurn
from app.providers.sarvam import call_sarvam, request_options

# Defensive: if a model ever returns its reasoning inline, never show it to the user.
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


class SarvamChatProvider:
    def __init__(
        self,
        client: AsyncSarvamAI,
        model: str,
        *,
        timeout_seconds: float,
        max_retries: int,
        max_tokens: int = 700,
        temperature: float = 0.2,
    ) -> None:
        self._client = client
        self._model = model
        self._options = request_options(timeout_seconds, max_retries)
        self._max_tokens = max_tokens
        self._temperature = temperature

    async def chat(self, messages: Sequence[ChatTurn]) -> str:
        """One completion. Thinking is off (reasoning_effort=None) to keep answers fast and short."""
        response = await call_sarvam(
            lambda: self._client.chat.completions(
                model=self._model,
                messages=[{"role": m["role"], "content": m["content"]} for m in messages],
                temperature=self._temperature,
                max_tokens=self._max_tokens,
                reasoning_effort=None,
                request_options=self._options,
            )
        )
        content = response.choices[0].message.content if response.choices else None
        text = _THINK_RE.sub("", content or "").strip()
        if not text:
            raise ProviderError(ProviderErrorKind.UNAVAILABLE, vendor_code="empty_completion")
        return text
