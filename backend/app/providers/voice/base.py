"""Voice interface (Sarvam AI STT/TTS). PRD §3.6."""

from typing import Protocol


class VoiceProvider(Protocol):
    async def transcribe(self, audio: bytes, lang: str) -> str:
        """Speech to text in hi-IN / en-IN."""
        ...

    async def speak(self, text: str, lang: str) -> bytes:
        """Text to speech audio."""
        ...
