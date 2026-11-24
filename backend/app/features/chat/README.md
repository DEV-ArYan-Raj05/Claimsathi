# chat

In-app assistant behind the x-10 sheet (PRD §3.6). `POST /api/v1/chat`, Supabase JWT required.

- Flow: detect language → translate to English (`sarvam-translate:v1`, English + 22 Indian languages)
  → `sarvam-105b` with the grounded system prompt (`prompts/system.md.j2`, facts from `rules/*.yaml`)
  → approval-promise guard (rules.md §9) → translate back. English skips both translations.
- Conversations are per user (`store.py`); another user's id is a 404. In-process only for now:
  TODO(PRD §6.1) move to a `chat_messages` table with RLS. Per-user limit: `CHAT_MESSAGES_PER_MINUTE`.
- Errors: `CHAT_*` codes in the one error shape; Sarvam details stay in the logs (IDs only).
- Vendors sit behind `providers/llm` (`ChatProvider`) and `providers/translation`; tests use the fakes.
- TODO(PRD §6.2): add `POST /api/v1/chat` to the endpoint list (the PRD names `/voice/intent`).
- Live check: `python scripts/sarvam_smoke.py` from `backend/`.
