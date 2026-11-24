# mock-insurer

`/admin/mock-insurer` — demo-only insurer console (PRD §3.5). Hidden from nav. Mounted only in demo mode or when `VITE_ENABLE_MOCK_INSURER=true`; the backend router is not mounted when `ENV=production`.

- Endpoint: `POST /admin/mock-insurer/{claim_id}/advance` (`stage_code?`, `response_text?`, `amount_approved?`)
