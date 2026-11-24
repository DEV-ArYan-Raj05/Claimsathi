"""Live check of the Sarvam setup in backend/.env: one chat, one translation, one language ID.

Run from backend/:  python scripts/sarvam_smoke.py
Prints only statuses and the start of each answer — never the API key.
"""

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings
from app.features.chat.knowledge import system_prompt
from app.providers.errors import ProviderError
from app.providers.llm.sarvam import SarvamChatProvider
from app.providers.sarvam import make_client
from app.providers.translation.sarvam import SarvamTranslationProvider
from app.rules.loader import Track


async def main() -> int:
    s = get_settings()
    key = s.sarvam_api_key.get_secret_value()
    print(
        f"SARVAM_API_KEY set: {bool(key)} · chat: {s.sarvam_chat_model} · "
        f"translate: {s.sarvam_translate_model}"
    )
    try:
        client = make_client(key, s.sarvam_timeout_seconds)
        timeout, retries = s.sarvam_timeout_seconds, s.sarvam_max_retries
        chat = SarvamChatProvider(client, s.sarvam_chat_model, timeout_seconds=timeout, max_retries=retries)
        tr = SarvamTranslationProvider(
            client, s.sarvam_translate_model, timeout_seconds=timeout, max_retries=retries
        )
        t0 = time.monotonic()
        answer = await chat.chat(
            [
                {"role": "system", "content": system_prompt(Track.CROP)},
                {"role": "user", "content": "Within how many hours must I report hail damage to my crop?"},
            ]
        )
        print(f"1. chat OK in {time.monotonic() - t0:.1f}s → {answer[:200]!r}")
        hindi = await tr.translate(answer[:400], "en-IN", "hi-IN")
        print(f"2. translate en→hi OK → {hindi[:160]!r}")
        print(f"3. language ID of 'मेरा क्लेम कहाँ है?' → {await tr.detect('मेरा क्लेम कहाँ है?')}")
    except ProviderError as err:
        print(f"FAILED: {err.kind.value} (HTTP {err.status}, Sarvam code {err.vendor_code})")
        return 1
    print("Sarvam is reachable with this key.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
