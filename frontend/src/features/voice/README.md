# voice

x-10 voice sheet over any screen, plus field dictation on x-05. PRD §3.6.

- Assistant: `POST /api/v1/chat` (FastAPI → Sarvam) when `VITE_CHAT_API_BASE_URL` (or `VITE_API_BASE_URL`)
  is set and Supabase Auth is on; otherwise the demo keyword intents at `POST /voice/intent`.
- The sheet keeps one conversation per signed-in user (memory only) and a reply language from 23
  (`languages.ts`), remembered on the device. Answers are read aloud with the browser's speech.
- `POST /voice/transcribe` / `speak` to be wired for phones without browser speech.
- Intents: policy cover, start a claim, missing documents, claim status.
