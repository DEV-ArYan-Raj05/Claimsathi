"""LLM provider interfaces (rules.md §9).

`LlmProvider` is for extraction: tool-use / JSON-schema output only, temperature 0.
`ChatProvider` is for the in-app assistant (PRD §3.6): free-text answers in English, which the
chat feature checks before showing.
"""

from collections.abc import Sequence
from typing import Any, Literal, Protocol, TypedDict


class LlmProvider(Protocol):
    async def extract(self, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        """Return JSON matching `schema`; caller validates with Pydantic and retries once."""
        ...

    async def yes_no(self, image: bytes, question: str) -> tuple[bool, list[float] | None]:
        """Vision yes/no with optional bbox — e.g. 'Is there a stamp or seal impression?'."""
        ...


class ChatTurn(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatProvider(Protocol):
    async def chat(self, messages: Sequence[ChatTurn]) -> str:
        """Return the assistant's reply text. Raises ProviderError on failure."""
        ...
