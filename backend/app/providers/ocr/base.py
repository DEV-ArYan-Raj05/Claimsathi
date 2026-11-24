"""OCR provider interface (PRD §5.2). Features depend on this, never on a vendor SDK."""

from typing import Protocol

from pydantic import BaseModel


class OcrPage(BaseModel):
    page: int
    text: str
    confidence: float


class OcrProvider(Protocol):
    async def read(self, image: bytes, handwriting: bool = True) -> list[OcrPage]:
        """Return text per page with confidence."""
        ...
