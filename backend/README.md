# ClaimSathi backend

FastAPI, Python 3.12, feature-first (rules.md §3.3). Track behaviour lives in `app/rules/{health,crop}.yaml`.

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload        # http://localhost:8000/docs
pytest && ruff check . && ruff format --check . && mypy
python scripts/sarvam_smoke.py       # live Sarvam check with backend/.env (prints no key)
```

## What is built

| Area | File | Tested |
|---|---|---|
| Track rules loader (typed, cached) | `app/rules/loader.py` | via all tests |
| Readiness score | `features/scoring/service.py` | yes |
| Stage due dates, overdue, interest flag | `features/tracker/service_dates.py` | yes |
| Document check registry (all PRD §3.3 checks) | `features/documents/service_checks.py` | yes |
| Bill totals in Decimal | `features/documents/service_bills.py` | yes |
| Claim letter templates + number post-check | `features/claim_pack/` | yes |
| WhatsApp webhook (signature), quiet hours, masking | `features/whatsapp/` | yes |
| Supabase JWT check (JWKS ES256/RS256 + legacy HS256), error shape, JSON logs, Aadhaar masking | `app/core/` | auth + masking yes |
| Provider interfaces (OCR, LLM, voice, telephony, storage, translation) | `app/providers/*/base.py` | n/a |
| Assistant `POST /api/v1/chat`: Sarvam chat + 22-language translation, per-user conversations | `features/chat/`, `providers/sarvam.py` | yes (fakes + SDK over mock HTTP) |

## Not built yet (TODOs in code)

SQLAlchemy models + Alembic migrations, repositories, the `/api/v1` routers in PRD §6.2, RQ jobs
(`extract_policy`, `check_document`, `build_pack`), vendor adapters (Cloud Vision, Anthropic, Sarvam, Twilio),
the Supabase Send-SMS hook, and the mock insurer router. The frontend runs end to end on its in-browser demo
server meanwhile, using the same paths and response shapes.
