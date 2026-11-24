"""Fake ChatProvider for tests and offline demos: records what it was sent, replies from a script."""

import asyncio
from collections.abc import Sequence

from app.providers.errors import ProviderError
from app.providers.llm.base import ChatTurn


class FakeChatProvider:
    def __init__(
        self, replies: list[str] | None = None, error: ProviderError | None = None, delay: float = 0
    ) -> None:
        self.replies = list(replies or ["You will need the signed claim form and your bills."])
        self.error = error
        self.delay = delay
        self.calls: list[list[ChatTurn]] = []

    async def chat(self, messages: Sequence[ChatTurn]) -> str:
        """Return the next scripted reply (the last one repeats), or raise the configured error."""
        self.calls.append(list(messages))
        if self.delay:
            await asyncio.sleep(self.delay)
        if self.error:
            raise self.error
        return self.replies.pop(0) if len(self.replies) > 1 else self.replies[0]
