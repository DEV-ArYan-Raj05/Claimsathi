"""Request/response models for POST /api/v1/chat (mirrored in frontend features/voice/api.ts)."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.features.chat.languages import LanguageCode
from app.rules.loader import Track

MAX_MESSAGE_CHARS = 1000  # Sarvam language identification and Mayura limits

Message = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_MESSAGE_CHARS)]
ConversationId = Annotated[str, StringConstraints(pattern=r"^conv_[A-Za-z0-9_-]{16,40}$")]
Intent = Literal["policy_cover", "start_claim", "missing_docs", "claim_status", "unknown"]


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: Message
    language: LanguageCode = "en-IN"
    track: Track
    conversation_id: ConversationId | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str = Field(description="The answer in the requested language.")
    reply_en: str = Field(description="The English answer the model wrote (before translation).")
    language: LanguageCode
    translated: bool
    intent: Intent
    route: str | None = Field(description="In-app screen for 'Take me there', if the question maps to one.")
