# Deploy ClaimSathi on Vercel

One Vercel project runs both parts with [Vercel Services](https://vercel.com/docs/services) (Beta):

| Service | Folder | What Vercel builds | Public path |
|---|---|---|---|
| `frontend` | `frontend/` | Vite build → static files on the CDN (Node 24) | everything except `/api/*` |
| `backend` | `backend/` | FastAPI (`app.main:app`) → one Vercel Function, Python 3.12, max 90 s | `/api/*` |

`vercel.json` holds the services, routing, security headers and caching. The frontend and the API share one
domain, so there is no CORS to configure and every preview deployment calls its own backend.

## 1. Push and import
1. Put this folder in a Git repository (GitHub, GitLab or Bitbucket) and push it.
2. Vercel → **Add New → Project** → import the repo. Keep **Root Directory** empty (the repo root, where
   `vercel.json` is). Vercel detects the services from `vercel.json`; don't change Build or Output settings.

CLI alternative: `npx vercel@latest` in this folder (links the project), then `npx vercel@latest deploy`.

## 2. Environment variables (Project → Settings → Environment Variables)
Set them for Production and Preview. Never put secret values in a `VITE_` variable: those are copied into
the JavaScript sent to browsers (the build refuses a Supabase secret key there).

| Name | Value | Used by | Sensitive |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | frontend (build) | no |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | frontend (build) | no |
| `VITE_CHAT_API_BASE_URL` | `/` (same domain) | frontend (build) | no |
| `SUPABASE_URL` | same as `VITE_SUPABASE_URL` | backend (checks sign-in tokens) | no |
| `SARVAM_API_KEY` | your Sarvam key | backend | **yes**, mark as Sensitive |
| `SARVAM_CHAT_MODEL` | `sarvam-105b` | backend | no |
| `ENV` | `production` (Production only) | backend: hides `/docs` and demo routes | no |

Leave `VITE_API_BASE_URL` empty until the other `/api/v1` routers exist: screens keep using demo data while the
assistant runs on the real backend. `CORS_ORIGINS` isn't needed on Vercel (same domain).
`VITE_INCLUDE_ARCHITECTURE=false` keeps the internal `/architecture` page out of public builds.

`VITE_*` values are read at build time: redeploy after changing them.

## 3. Supabase settings for the deployed URL
Supabase → Authentication → URL Configuration:
- **Site URL**: your production URL (e.g. `https://claimsathi.vercel.app` or your domain).
- **Redirect URLs**: add `https://<your-domain>/auth/callback`, `https://<your-domain>/reset-password`, and for
  previews `https://*-<your-team>.vercel.app/auth/callback` and `…/reset-password`.

## 4. Check the deployment
- `https://<your-domain>/` loads; deep links such as `/health/claims` load after a refresh.
- `https://<your-domain>/api/v1/chat` with POST and no sign-in → `401 AUTH_REQUIRED` (the backend is live).
- Sign in → **Voice** → ask a question. Function logs: Project → Logs (IDs only, never message text or keys).

## Notes and limits
- **Conversation memory** for the assistant lives in the function instance's memory. Fluid compute reuses
  instances, but a new instance starts without it; the app then starts a new conversation automatically.
  The per-user rate limit is also per instance. TODO(PRD §6.1): move both to Postgres / a shared store.
- **Python deps** are pinned in both `backend/pyproject.toml` (what Vercel installs, with `uv.lock`) and
  `backend/requirements.txt` (Docker / local); `tests/test_dependencies.py` keeps them identical.
- **Versions**: Node 24 (`frontend/package.json` engines; Node 20 was retired on Vercel on 1 Oct 2026) and Python
  3.12 (`backend/.python-version`).
- **Build locally like Vercel**: `npx vercel@latest build` (after `vercel link` or with `.vercel/project.json`).
- `netlify.toml` and `docker-compose.yml` are for other hosts / local dev; Vercel ignores them (`.vercelignore`).
