rules.md — ClaimSathi Engineering Rules
   Read this whole file before writing any code. It is the contract for every coding agent
   (Claude Code, Antigravity, Cursor, Lovable follow-ups) and every human on the team.
   Detailed product behaviour lives in docs/PRD.md . When this file and the PRD disagree on
   code structure or standards, this file wins. When they disagree on product behaviour, the
   PRD wins. If something is unclear, follow section 16 — never invent behaviour.

1. Project context (60-second version)
    ClaimSathi is a B2C web app that helps low-income Indian policyholders file micro-
    insurance claims. It turns a policy document + handwritten bills / field photos into an
    insurer-ready claim pack, flags missing stamps and documents, scores readiness, and
    tracks the claim until payment. Built for the Build for Bharat hackathon (Track 1 Fintech,
    prompt 3).
    Two tracks, one codebase: health (health + accident, sum insured ≤ ₹1,00,000) and crop
    (PMFBY, RWBCIS, state schemes). Track is a parameter, never a fork.
    Users: farmers (Hindi, low-end Android, 3G), domestic/daily workers, and helpers (CSC
    operators, NGO volunteers) filing for others.
    Languages: English + Hindi everywhere (UI, letters, WhatsApp, voice).
    We do not file into insurer systems, handle cashless claims, give legal advice, or ever
    promise approval.

2. Golden rules (non-negotiable)
 1. One feature = one folder. All code for a feature lives inside its folder (section 3).
 2. File size: aim for ≤ 300 lines. Hard limit 400 lines. Over 300 → plan a split. Over 400 → split
    before committing (section 4).
 3. No secrets in code. Keys live only in .env (backend) and .env.local (frontend, public
    keys only). Never print, log, commit, or paste a key into chat, docs or prompts.
 4. Contracts are frozen: screen IDs, routes, endpoint paths, table/column names, colour token
    names, check codes and stage codes listed here and in the PRD. Rename only after the PRD
    is edited first.
 5. Track is data, not branches. No if track == "health" scattered in services. Track-
    specific behaviour comes from backend/app/rules/{health,crop}.yaml and frontend
    track config.
 6. Money, dates and totals are computed in code (Python Decimal / TypeScript), never by
    an LLM.
 7. No hard-coded UI strings. Every user-facing string goes through i18n (en + hi).
 8. No hard-coded colours. Components use CSS variable tokens only. No hex in components.
 9. Change only what the task asks. Do not refactor, rename or reformat other features.
10. Portable, publish-ready code (section 5): runs on Windows/macOS/Linux, deploys with
    one command, passes lint + format + type checks.
11. When unsure, leave // TODO(PRD §x.y): question / # TODO(PRD §x.y): question and
    move on. Do not guess business rules.
3. Folder structure — feature-first
This replaces the layer-based layout in PRD §5.3. Code is grouped by feature, not by type.
3.1 Repository root

  claimsathi/
    rules.md                 # this file
    CLAUDE.md / AGENTS.md    # one line: "Read rules.md, then docs/PRD.md"
    README.md                # what it is, how to run, how to deploy
    LICENSE
    .editorconfig .gitattributes .gitignore .env.example
    docs/PRD.md
    design/                  # Figma links, tokens.json, scroll-refs/
    scripts/check_file_size.py
    frontend/
    backend/
    docker-compose.yml       # api + worker + redis for local dev
3.2 Frontend ( frontend/src/ )

  src/
    app/                          # bootstrapping only: main.tsx, router.tsx,
  providers.tsx
    shared/
       ui/                        # shadcn/ui primitives (generated, do not hand-
  edit heavily)
       components/                # cross-feature components from PRD §4.2
                                  # TopBar, TrackSwitcher, BottomNav, ScoreRing,
  CountdownTimer,
                                  #     EmptyState, Skeleton, LanguageToggle,
  UploadSlot, AlertItem ...
       lib/                       # api client, supabase client, formatters (money,
  dates), utils
       hooks/                     # generic hooks (useTrack, useMediaQuery,
  useReducedMotion)
       theme/tokens.css           # data-track CSS variables
       i18n/                      # i18next setup
       api/schema.d.ts            # GENERATED from FastAPI OpenAPI — never edit by
  hand
    features/
       landing/                   # S-01
       auth/                      # S-02 login, S-03 onboarding, /auth/callback,
  WhatsApp verify
       dashboard/                 # x-01
       policies/                  # x-02, x-03, x-04 (incl. "Ask this policy")
       claims/                    # x-05 incident form, x-08 my claims
       documents/                 # x-06 uploads, checks, alerts, checklist
       scoring/                   # readiness score widgets used by x-01 / x-06
       claim-pack/                # x-07 preview, download, share, send
       tracker/                   # x-09 timeline, expected date, update status,
  escalation
       voice/                     # x-10 voice sheet + mic button
       settings/                  # x-11
       mock-insurer/              # /admin/mock-insurer (demo only, hidden from nav)
    locales/
       en/<feature>.json          # one namespace per feature (keeps files small)
       hi/<feature>.json

Inside every frontend feature folder:
features/policies/
  index.ts                  # PUBLIC API — the only file other features may
import
  routes.tsx                # route objects for this feature
  pages/                    # one file per screen, named by screen ID:
    X02PolicyDirectoryPage.tsx
    X03AddPolicyPage.tsx
    X04PolicyDetailPage.tsx
  components/               # components used only by this feature
  hooks/                    # TanStack Query hooks: usePolicies, usePolicy,
useAskPolicy
  api.ts                    # typed calls to /api/v1/policies/* (uses
shared/lib api client)
  schemas.ts                # Zod schemas (mirror backend Pydantic)
  store.ts                  # Zustand slice, only if the feature needs client
state
  types.ts
  README.md                 # 5–15 lines: purpose, screens, endpoints, PRD
section
3.3 Backend ( backend/app/ )

  app/
    main.py                      # create app, mount feature routers, nothing else
    core/                        # config (pydantic-settings), db session, auth
  (JWT verify),
                                 # errors, logging, security helpers (masking),
  pagination
    providers/               # adapters behind interfaces — PRD §5.2
      ocr/ llm/ voice/ telephony/ storage/
                             # each: base.py (Protocol) + one file per vendor
    rules/
      health.yaml crop.yaml # checklists, checks + severities, score weights,
  deadlines, stages
      loader.py              # typed loader, cached
    workers/
      queue.py registry.py # RQ setup; job functions live inside features
    features/
      auth/                  # send-otp hook, /me/whatsapp/confirm
      profile/               # /me, /members, /land-parcels
      files/                 # /files/upload-url
      policies/              # PRD §3.1 — upload, extract_policy job, detail,
  ask
      claims/                # /claims create/list/detail/submit, coverage
  check
      documents/             # PRD §3.3 — check_document job, checklist,
  overrides
      scoring/               # PRD §3.4 — readiness score
      claim_pack/            # PRD §3.2 — build_pack job, letter, PDF
      tracker/               # PRD §3.5 — stages, parse evidence, escalation,
  inbound email
      voice/                 # PRD §3.6 — transcribe, speak, intent
      calls/                 # PRD §3.6 — reminder calls, telephony webhook
      whatsapp/              # PRD §3.8 — templates, notify worker,
  /webhooks/whatsapp
      dashboard/
      jobs/                  # GET /jobs/{id}
      mock_insurer/          # demo only; router not mounted when
  ENV=production
    tests/                   # mirrors features/:
  tests/features/policies/test_service.py
  alembic/                   # migrations (one per change, descriptive names)

Inside every backend feature folder:
 features/policies/
   __init__.py                  # PUBLIC API — export only what other features may
 use
   router.py                    # FastAPI routes. Thin: validate → call service →
 return schema
   schemas.py                   # Pydantic request/response models
   models.py                    # SQLAlchemy models for tables this feature owns
   repository.py                # all DB queries for this feature
   service.py                   # business logic (split into service_*.py if it
 grows)
   jobs.py                      # background jobs (e.g. extract_policy)
   prompts/                     # LLM prompt templates (.md / .j2), never inline
 long prompts
   templates/                   # Jinja2 templates (claim_pack, whatsapp)
   README.md


3.4 Import boundaries
    A feature may import from shared/ (frontend) or core/ , providers/ , rules/
    (backend).
    A feature may import another feature only through its index.ts / __init__.py . No deep
    imports like features/claims/components/ClaimCard .
     shared/ , core/ , providers/ must never import from features/ .
    No circular imports. If two features need the same code, move it to shared/ / core/ .
    Table ownership: each table has one owning feature (its models.py ). Other features read it
    through the owner's public service functions, not by querying the table directly.
Table                                                                         Owner feature

profiles, members, land_parcels                                               profile

files                                                                         files

policies, policy_clauses                                                      policies

claims                                                                        claims

claim_documents, document_checks, bill_items                                  documents

score_snapshots                                                               scoring

claim_packs                                                                   claim_pack

claim_stages                                                                  tracker

notifications, whatsapp_messages                                              whatsapp

call_logs                                                                     calls

jobs                                                                          jobs



4. File size and splitting
Limit                         Rule

≤ 300 lines                   Target for every source file

301–400                       Allowed, but add a split to the plan for the next task touching it

> 400                         Not allowed. Split before committing

Function / component body     ≤ 50 lines; ≤ 4 levels of nesting; ≤ 5 parameters (use an object/model)


Counted: every .ts .tsx .py .css .yaml .sql .j2 .html file you write.
Not counted: generated files ( shared/api/schema.d.ts , shared/ui/* from shadcn), lockfiles,
Alembic auto-generated migrations, docs/ , test fixtures/data.
How to split (pick the one that fits):
        Component too big → extract sub-components into components/ ( PolicyCoverageCard ,
         PolicyClauseList ); move data fetching into a hook; move pure logic into utils.ts .
        Page too big → page only composes sections; each section is its own component.
        Service too big → split by responsibility: service_extract.py , service_validate.py ,
         service_summary.py ; keep service.py as the thin orchestrator.
     Router too big → router_read.py / router_write.py , combined in router.py .
     Long prompt / template → move to prompts/*.md or templates/*.j2 .
     Constants / mappings → constants.py / constants.ts or the track YAML.
     Locale file too big → it's already per-feature; split further by screen if needed.
Check script (cross-platform, run in CI and before every commit):

  python

  # scripts/check_file_size.py — fails if any source file exceeds 400 lines,
  warns above 300
  import sys
  from pathlib import Path

  EXT = {".ts", ".tsx", ".py", ".css", ".yaml", ".yml", ".sql", ".j2", ".html"}
  SKIP = {"node_modules", ".venv", "dist", "build", "alembic", "ui", "docs",
  "__pycache__"}
  SKIP_FILES = {"schema.d.ts"}
  WARN, MAX = 300, 400

  def main() -> int:
      failed = False
      for path in Path(".").rglob("*"):
          if path.suffix not in EXT or path.name in SKIP_FILES:
              continue
          if any(part in SKIP for part in path.parts):
              continue
          lines = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
          if lines > MAX:
              print(f"ERROR {lines:>4} lines {path}")
              failed = True
          elif lines > WARN:
              print(f"WARN {lines:>4} lines {path}")
      return 1 if failed else 0

  if __name__ == "__main__":
      sys.exit(main())


5. Portable, publish-ready code
The repo must be clonable and runnable by a stranger (or a judge) on any OS, and publishable to
GitHub / Vercel / Docker without edits.
     Cross-platform: use pathlib (Python) and path /URL APIs (TS) — never string-
     concatenated paths or \ . No Bash-only or PowerShell-only scripts; put tasks in
 package.json scripts or small Python scripts. All files UTF-8, LF line endings
( .gitattributes: * text=auto eol=lf ).
No machine-specific values: no absolute paths, usernames, localhost URLs or ports in
code. Everything environment-dependent comes from env vars with defaults in
 .env.example .
One-command run:
      Frontend: npm install && npm run dev
      Backend: docker compose up (api + worker + redis) or pip install -r
     requirements.txt && uvicorn app.main:app --reload
Pinned dependencies: commit package-lock.json and pinned requirements.txt (or
 uv.lock ). Node 20 LTS, Python 3.12 — declared in .nvmrc , engines , and Dockerfile .
Formatting & linting (must pass with zero errors):
     Frontend: ESLint + Prettier, tsc --noEmit with "strict": true . No any (use
      unknown
           narrowing). No // @ts-ignore without a reason comment.
     Backend: Ruff (lint + format), mypy (strict on features/ and core/ ).
     .editorconfig : 2 spaces TS/CSS/JSON/YAML, 4 spaces Python, final newline.
Language of code: identifiers, comments, commit messages and docs in English. User-
facing text in locale files (en + hi).
Self-documenting: every feature has a short README.md ; every public function has a one-
line docstring/JSDoc; non-obvious logic gets a why comment citing the PRD section.
Deploy targets: frontend on Vercel (SPA rewrite in vercel.json ), backend as a Docker
image (API and worker are two services from the same image). ENV=production disables
 /admin/* and mock routes.
No dead code: no commented-out blocks, no unused exports, no console.log / print left
behind (use the logger).
6. Naming conventions
Thing                     Convention                  Example

Frontend folders          kebab-case                  claim-pack/

Backend folders / files   snake_case                  claim_pack/service_letter.py

React components &        PascalCase                  ScoreRing.tsx
files

Screen pages              <ScreenId><Name>Page        X09ClaimTrackerPage.tsx ,
                                                      S02LoginPage.tsx

Hooks                     useX camelCase              useClaimChecklist.ts

TS variables /            camelCase                   expectedSettlementDate
functions

Python functions / vars   snake_case                  compute_readiness_score

Classes / Pydantic /      PascalCase                  PolicyExtract , CheckResult
Zod

Constants                 UPPER_SNAKE                 MAX_UPLOAD_MB = 20

DB tables / columns       snake_case, plural tables   claim_stages.entered_at

Check codes               UPPER_SNAKE                 BILL_STAMP_MISSING , PHOTO_NOT_GEOTAGGED

Stage codes               snake_case                  submitted , query_raised ,
                                                      surveyor_appointed

i18n keys                 feature.screen              policies.detail.rejectRisksTitle
                          .element

Env vars                  UPPER_SNAKE                 ANTHROPIC_API_KEY

Booleans                  is_ / has_ / can_           isOverdue , has_stamp



7. Frontend rules
Stack (fixed): React 18 + Vite + TypeScript, Tailwind + CSS-variable tokens, shadcn/ui + Lucide,
React Router v6, TanStack Query (server state), Zustand (client state: track, language, voice
sheet), React Hook Form + Zod, i18next, GSAP + ScrollTrigger + Lenis + Motion, API types
generated with openapi-typescript . Do not add another UI kit, state library or CSS framework.
Routing & tracks
     Routes: / , /login , /onboarding , /auth/callback , /{track} , /{track}/policies ,
      /{track}/policies/new , /{track}/policies/:id , /{track}/claims ,
      /{track}/claims/new , /{track}/claims/:id , /{track}/claims/:id/documents ,
      /{track}/claims/:id/pack , /settings , /admin/mock-insurer . track         ∈   health |
     crop .
     Switching track keeps the equivalent route. Theme = data-track attribute on <html> .
     Last track saved to profile + localStorage (wrap storage access in try/catch).
     Track switch animation: 400 ms colour cross-fade + sliding pill; instant if prefers-
     reduced-motion .

Colour tokens — only these, via Tailwind theme mapped to CSS vars: --color-dominant (60%),
 --color-secondary (30%), --color-accent (≤10%), --color-ink , --color-on-dominant , -
-color-muted , --color-success . Values live only in shared/theme/tokens.css (see PRD §2).

Accent colour is allowed on exactly six things: the single primary CTA of a screen; missing-
document / missing-stamp alerts; deadline countdowns; readiness score < 60; status "Query
raised" / "Rejected"; the amount on the expected-settlement card. Never on headings, icons,
borders, links, hovers, charts or illustrations.
Every screen handles 5 states: loading (skeletons, never blank), empty (illustration + one
action), error (plain-language message + retry), offline (queued uploads "waiting for network"),
long jobs (progress steps; user can leave and is notified). Build these with shared components.
Accessibility & low-end devices
     WCAG AA contrast; touch targets ≥ 48 px; base font 16 px, min 14 px; Devanagari-capable
     font.
     Every icon button has an aria-label (translated). Full keyboard support.
     Mobile-first at 360 px; desktop = centred 1200 px with left sidebar.
     Compress images on-device before upload (max 1600 px, ~80% JPEG). Accept JPG, PNG,
     HEIC, PDF ≤ 20 MB.
     Initial JS per route < 200 KB gzipped; lazy-load routes and GSAP. Lighthouse mobile perf ≥
     85.
Motion: scroll-driven animation only on S-01 and x-01 (and x-09 timeline draw-in). Animate only
transform and opacity . No bounce/elastic easing. Disable when reduced-motion or
navigator.deviceMemory < 4 .

Data access: components never call fetch directly. Use the feature's api.ts + query hooks.
Server data never goes into Zustand. Forms validate with Zod schemas that mirror the backend
models.

8. Backend rules
Stack (fixed): Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (async) + Alembic, Supabase
(Postgres, Auth, Storage), RQ + Redis (fallback: BackgroundTasks), PyMuPDF, Pillow, OpenCV,
piexif, rapidfuzz + indic-transliteration, Jinja2 + WeasyPrint, Anthropic SDK, Google Cloud
Vision, Sarvam AI, Twilio, Sentry.
Layering inside a feature: router → service → repository → DB.
     Routers: no business logic, no SQL. Validate input, call one service function, return a
     schema.
     Services: business logic, no FastAPI imports, no raw HTTP to vendors (use providers/ ).
     Repositories: the only place with SQL/ORM queries. Always filter by user_id .
API conventions
     Prefix /api/v1 . Auth: Authorization: Bearer <supabase jwt> verified on every request
     ( core/auth.py dependency). Webhooks are signature-verified instead.
     Track-scoped endpoints take ?track=health|crop (validated enum).
     Every response is a Pydantic model (so OpenAPI → TS types stay exact).
     Errors use one shape: {"error": {"code": "POLICY_NOT_FOUND", "message": "...",
     "details": {}}} raised via core/errors.py . No bare HTTPException strings.
     Long work (OCR, extraction, checks, PDF) is always a job → return {job_id} ; the client
     polls GET /jobs/{id} . Never block a request > 2 s.
     Endpoint list is in PRD §6.2 — implement paths exactly as written.
Providers: all vendors sit behind Protocols — OcrProvider , LlmProvider , VoiceProvider ,
 TelephonyProvider , StorageProvider . Features depend on the Protocol, never on a vendor
SDK. Provide a fake implementation of each for tests and offline demos.
Track rules: checklists, check codes + severities, score weights, deadlines, and stage lists are read
from rules/{track}.yaml . Adding a check = YAML entry + one check function registered by
code. Score weights are never hard-coded.
Database: every user-owned row has user_id and track . Row-level security enabled on every
table. Schema changes only via Alembic migrations — never edit the DB by hand. claim_stages
is append-only. Money columns numeric(12,2) ; timestamps timestamptz in UTC; convert to
Asia/Kolkata only for display.

9. AI pipeline rules (PRD §7.1)
     LLM output must use tool-use / JSON-schema and be validated by Pydantic; one retry on
     failure, then mark fields "please confirm".
     Extraction runs at temperature 0. Every extracted field carries page + quote ; the quote
     must string-match the OCR text or the field is nulled.
     The vision model only answers yes/no + bbox questions (stamp present? signature
     present?). Rules, arithmetic and date windows run in Python.
     The claim letter: Jinja2 template fills fixed parts; the LLM writes only the short incident
     narrative from the user's own fields. A post-check confirms every number/date in the letter
     exists in claim data.
     Show "AI read this, please check" for confidence < 0.7. OCR confidence < 0.6 on key fields →
     ask for a clearer photo.
     Never output wording that predicts or promises approval. The score is "readiness", not odds.
     Prompts live in features/<feature>/prompts/ , versioned, with the expected output
     schema named at the top.
     Mask Aadhaar (12-digit pattern) on images before sending to any AI provider.
10. Security & privacy (DPDP Act)
    Secrets only in env vars; .env* in .gitignore ; .env.example lists names, no values.
     SUPABASE_SERVICE_ROLE_KEY is backend-only. Frontend gets only VITE_SUPABASE_URL ,
     VITE_SUPABASE_ANON_KEY , VITE_API_BASE_URL .
    Storage buckets private; signed URLs valid 10 minutes.
    Store Aadhaar and bank account as last 4 digits only; full bank number only inside the
    generated PDF.
    Logs contain IDs only — no document text, names, phone numbers or PII. Structured JSON
    logs.
    Explicit consent at signup for document storage and calls/SMS; WhatsApp updates need a
    separate opt-in (default off). "Delete my data" removes files and rows.
    Webhooks and the Supabase Send-SMS hook verify signatures. OTP, hooks and webhooks
    are rate-limited per phone number.
    Validate file type by content (magic bytes), not just extension. Max 20 MB.
    Admin / mock routes are not mounted when ENV=production .

11. Auth: Google + WhatsApp (PRD §3.7)
    Use Supabase Auth only — no custom auth code. Google OAuth with scopes openid email
    profile .
    Google sign-in, phone OTP send and verify run in the browser via supabase-js .
    Number verification: updateUser({ phone }) → OTP on WhatsApp → verifyOtp({ type:
    'phone_change' }) → POST /api/v1/me/whatsapp/confirm , which checks the phone
    belongs to the signed-in user and clears stale phone_change values.
    Fallback sign-in: WhatsApp OTP directly; Google can be linked later with linkIdentity .
    Users can browse and add policies before verifying; WhatsApp updates require verified +
    opted-in.

12. WhatsApp, calls and notifications (PRD §3.6, §3.8)
    Business-initiated messages use pre-approved Twilio templates only (en + hi, variables
    only).
    Message text: policy no. masked to last 4; no diagnosis, documents or bank details.
    Quiet hours 21:00–08:00 IST, except crop 72-hour deadline alerts.
    Idempotency key = stage_id + kind ; retries never send twice. Failed WhatsApp → SMS
    fallback.
    Inbound keywords: STATUS , STOP (opt-out immediately), HELP .
    All calls logged in call_logs ; only call users with call_consent = true .
    Use Twilio for calls/SMS/WhatsApp (the PRD's Exotel keys are superseded).

13. Testing
    Backend: pytest . Each feature has tests for service logic and router happy/error paths.
    Must-test: every document check, score calculation, deadline/expected-date maths, bill
    totals, masking helpers, webhook signature verification. Use fake providers — tests never
    call real vendors or need real keys.
     Frontend: Vitest + Testing Library for hooks, utils and key components (TrackSwitcher,
     ScoreRing bands, AlertItem). Formatters for ₹ and dates must be tested.
     Test files follow the same 400-line limit and mirror feature folders.

14. Git workflow
     Branch per task: feat/<feature>-<short> , fix/<feature>-<short> .
     Conventional commits: feat(policies): add clause risk ranking .
     One feature per commit/PR where possible. Never commit .env , build output or uploads.
     Before pushing: lint, format, type-check, tests, python scripts/check_file_size.py — all
     pass.

15. Definition of done (check every item before saying "done")
     Code is inside the correct feature folder; cross-feature imports only via public index
     No file > 400 lines (aim ≤ 300); functions ≤ 50 lines
     Lint, format, type-check and tests pass
     No hard-coded strings, colours, secrets, URLs or paths
     Both tracks work (or the track difference is in YAML/config)
     en + hi strings added
     Loading / empty / error / offline states handled (UI work)
     Accent used only on the six allowed elements
     Endpoints, tables and screen IDs match the contracts exactly
     Feature README.md updated if behaviour or endpoints changed
     Final message to the user lists: files changed, anything left as TODO, how to test it

16. When unsure, and what never to do
When unsure: check docs/PRD.md → if still unclear, add TODO(PRD §x.y): <question> , pick the
safest minimal behaviour, and list the question in your final message.
Never:
     Touch files outside the feature named in the task (except adding an export to index.ts /
      __init__.py or registering a route/job).
     Rename contract names, delete migrations, or edit generated files by hand.
     Add a new dependency without stating why in the final message.
     Let an LLM calculate amounts, dates or totals, or decide pass/fail of a rule.
     Send documents, diagnoses or full policy/bank numbers over WhatsApp, SMS or logs.
     State or imply that a claim will be approved.
     Disable lint rules, type checks, RLS or signature checks to "make it work".
17. Known PRD decisions resolved here
Topic                             Decision

Repo layout (PRD §5.3 is layer-   Feature-first layout in section 3 of this file
based)

Locale files                      Split per feature: locales/{en,hi}/<feature>.json
( /locales/en.json )

Telephony vendor (Exotel vs       Twilio only
Twilio)

Colour mapping                    Crop = olive / beige / terracotta; Health = sky blue / cloud white /
                                  muted red (confirm in Figma)

Product name                      "ClaimSathi" (working name — keep it in one config constant)

Demo languages                    Hindi + English
