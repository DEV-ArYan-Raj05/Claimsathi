# ClaimSathi

Micro-insurance claim assistant for Build for Bharat (Track 1 Fintech, prompt 3). It turns a policy paper
and a pile of handwritten bills or field photos into an insurer-ready claim, flags missing stamps and
documents, scores readiness, and tracks the claim until the money lands. Two tracks, one codebase:
**Health** (incl. accident) and **Crop** (PMFBY, RWBCIS, state schemes). English + Hindi throughout.

Start here: **`strategy.md`** (why it's built this way) → `rules.md` → `docs/PRD.md` → `DESIGN.md`.

## Run the frontend (works with no backend)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

With `VITE_API_BASE_URL` empty, the app runs on its in-browser demo server with seeded demo data.
Nothing is sent anywhere, and each demo account keeps its own data in the browser's localStorage.

## Demo accounts

Open `/login` and sign in with any of these. You can also tap an account on the login page to fill it in.

| Who | Email | Password | Lands on | What to try |
|---|---|---|---|---|
| Sunita Devi (health) | `sunita@demo.claimsathi.in` | `Health@123` | `/health` | Claim with 3 bills, score 55 → re-upload the stamped bill → score rises → claim pack. `/health/claims/clm_h2` is overdue (interest note + escalation letter). |
| Ramesh Kumar (crop) | `ramesh@demo.claimsathi.in` | `Crop@123` | `/crop` | Tractor scroll story + 72-hour countdown → claims → documents (old field photo rejected). |
| Judge (both tracks) | `judge@demo.claimsathi.in` | `Judge@123` | `/health` | Switch Health ⇄ Crop, and `/admin/mock-insurer` to move claims through stages live. |
| New user | `new@demo.claimsathi.in` | `Welcome@123` | `/onboarding` | The first-time flow: onboarding form, then the dashboard. |

"Continue with Google" and the WhatsApp code (any 6 digits) also work in demo mode and open the **New user**
account. **Settings → Delete my data** resets the signed-in account to its seeded story.

These are test logins for the in-browser demo only (`frontend/src/shared/lib/demo/accounts.ts`). They do nothing
when the app is connected to the real backend, which signs in through Supabase Auth only.

## Real sign-in with Supabase Auth

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env.local` (names in `.env.example`)
and run the SQL in `supabase/migrations/` once. Sign-in then uses Supabase Auth: email + password (sign-up,
email confirmation, forgot/reset password), Google and WhatsApp OTP. Without those two variables the demo
accounts above are used. Claims data still comes from the in-browser demo server until `VITE_API_BASE_URL`
is set, kept separately per signed-in user and cleared from the browser on sign-out.

## AI assistant (Sarvam AI)

The Voice sheet answers claim questions through `POST /api/v1/chat` on the backend, which uses Sarvam AI
(`sarvam-105b` chat, `sarvam-translate:v1` for 22 Indian languages). Put `SARVAM_API_KEY` and `SUPABASE_URL` in
`backend/.env`, add `http://localhost:5173` to `CORS_ORIGINS`, set `VITE_CHAT_API_BASE_URL=http://localhost:8000`
in `frontend/.env.local`, and run the backend. Without it the sheet uses the demo replies.

## Architecture diagram

The team's interactive architecture diagram (`internal/architecture/index.html`) is served at **`/architecture/`**
in dev and in every build. It keeps its "INTERNAL" banner and `noindex`, and nothing in the app links to it.
Build with `VITE_INCLUDE_ARCHITECTURE=false` to leave it out.

## Run the backend

```bash
cd backend
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
pytest && ruff check . && mypy
```

See `backend/README.md` for what's built (scoring, deadlines, document checks, letters, WhatsApp webhook) and what's TODO.

## Repo map

```
frontend/   React 18 + Vite + TS + Tailwind, feature-first (src/features/<feature>/)
backend/    FastAPI, feature-first (app/features/<feature>/), track rules in app/rules/*.yaml
internal/   architecture diagrams; index.html is also served at /architecture/ (internal/README.md)
docs/PRD.md product spec     rules.md engineering contract     DESIGN.md tokens + motion
strategy.md design decisions and how to tune the scroll animations
```

## Deploy

The demo needs **no environment variables**. Push this repo to GitHub, then either:

- **Vercel (frontend + FastAPI backend in one project):** import the repo with the root directory left as the repo
  root. `vercel.json` defines two Vercel Services: `frontend/` (Vite, static) and `backend/` (FastAPI at `/api/*`).
  Environment variables, Supabase redirect URLs and checks: see [docs/deploy-vercel.md](docs/deploy-vercel.md).
- **Netlify (frontend only, demo data):** "Add new site → Import an existing project", pick the repo. `netlify.toml` has the settings.

For real sign-in and the AI assistant, set the variables listed in `docs/deploy-vercel.md` (names also in
`.env.example`) in the host's environment settings and redeploy.

- Backend: `docker compose up` locally; the same image runs API and worker. Its `/api/v1` routers are still TODO
  (see `backend/README.md`), so the hosted demo runs on the in-browser demo server.
- Secrets only in env vars; names in `.env.example`.
- CI: `.github/workflows/ci.yml` runs frontend lint, typecheck, tests and build, backend pytest + ruff, and the
  file-size check on every push and pull request.

Before pushing: `python scripts/check_file_size.py` (fails over 400 lines, warns over 300).
