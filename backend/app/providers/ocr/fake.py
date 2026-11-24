"""Fake OCR for tests and offline demos — no network, no keys."""

from app.providers.ocr.base import OcrPage


class FakeOcr:
    def __init__(self, pages: list[OcrPage]) -> None:
        self.pages = pages

    async def read(self, image: bytes, handwriting: bool = True) -> list[OcrPage]:
        """Return the canned pages."""
        return self.pages
