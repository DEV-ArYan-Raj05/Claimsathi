"""Conversation memory and per-user rate limiting for the assistant.

In-process for now: conversations live as long as the API process (and expire after
CONVERSATION_TTL). TODO(PRD §6.1): move to a `chat_messages` table with user_id + RLS when the
repositories land; with several API workers, a conversation only exists on the worker that made it.
Every lookup is by (user_id, conversation_id): another user's id behaves exactly like an unknown one.
"""

import secrets
import time
from collections import deque
from dataclasses import dataclass, field

from app.providers.llm.base import ChatTurn
from app.rules.loader import Track

CONVERSATION_TTL_SECONDS = 24 * 3600
MAX_CONVERSATIONS_PER_USER = 20
MAX_STORED_TURNS = 40  # older turns are dropped; the model only sees the most recent ones


@dataclass
class Conversation:
    id: str
    user_id: str
    track: Track
    turns: list[ChatTurn] = field(default_factory=list)  # English, so context is model-friendly
    updated_at: float = field(default_factory=time.monotonic)

    def add(self, question_en: str, answer_en: str) -> None:
        """Append one exchange and trim old turns."""
        self.turns += [
            {"role": "user", "content": question_en},
            {"role": "assistant", "content": answer_en},
        ]
        del self.turns[:-MAX_STORED_TURNS]
        self.updated_at = time.monotonic()


class ConversationStore:
    def __init__(self) -> None:
        self._by_user: dict[str, dict[str, Conversation]] = {}
        self._now = time.monotonic

    def _expire(self, user_id: str) -> dict[str, Conversation]:
        convos = self._by_user.setdefault(user_id, {})
        cutoff = self._now() - CONVERSATION_TTL_SECONDS
        for cid in [c.id for c in convos.values() if c.updated_at < cutoff]:
            del convos[cid]
        return convos

    def get(self, user_id: str, conversation_id: str) -> Conversation | None:
        """The user's own conversation, or None (also for other users' ids)."""
        return self._expire(user_id).get(conversation_id)

    def create(self, user_id: str, track: Track) -> Conversation:
        """New conversation with an unguessable id; evicts the user's oldest beyond the cap."""
        convos = self._expire(user_id)
        if len(convos) >= MAX_CONVERSATIONS_PER_USER:
            oldest = min(convos.values(), key=lambda c: c.updated_at)
            del convos[oldest.id]
        convo = Conversation(id=f"conv_{secrets.token_urlsafe(18)}", user_id=user_id, track=track)
        convos[convo.id] = convo
        return convo


class RateLimiter:
    """Sliding one-minute window per user, protecting the Sarvam credits."""

    def __init__(self, per_minute: int) -> None:
        self._per_minute = per_minute
        self._hits: dict[str, deque[float]] = {}

    def retry_after(self, user_id: str) -> int | None:
        """Record a request; return seconds to wait if the user is over the limit, else None."""
        now = time.monotonic()
        hits = self._hits.setdefault(user_id, deque())
        while hits and hits[0] <= now - 60:
            hits.popleft()
        if len(hits) >= self._per_minute:
            return max(1, int(60 - (now - hits[0])) + 1)
        hits.append(now)
        return None
