# claims

x-05 `/{track}/claims/new` (incident form + coverage check) and x-08 `/{track}/claims`. PRD §3.2, §4.1.

- Endpoints: `POST /claims`, `GET /claims?track=`, `GET /claims/{id}`
- Incident fields come from `shared/config/tracks.ts`; the Zod schema is built from them, so one form serves both tracks.
- Fine-print / waiting-period warnings are shown before continuing, in accent, with Continue / Stop.
