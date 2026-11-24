# scoring

Readiness score widgets used on x-01 and x-06. PRD §3.4.

- Endpoint: `GET /claims/{id}/score` (also embedded in `GET /claims/{id}`)
- Weights live in `backend/app/rules/{track}.yaml` (mirrored in `shared/config/tracks.ts`).
- Bands: 80+ ready (success), 60–79 fix (dominant), under 60 high risk (accent).
