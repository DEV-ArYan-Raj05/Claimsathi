# documents

x-06 `/{track}/claims/:id/documents`: alert list, checklist with upload slots, readiness score. PRD §3.3.

- Endpoints: `POST /files/upload-url`, `POST /claims/{id}/documents` (starts `check_document`), `POST /claims/{id}/checks/{check_id}/override`, `GET /claims/{id}`
- Alerts: missing required items first, then failed checks (critical → high → medium), overridden last.
- Critical failures block "Send to insurer" on x-07 until fixed or overridden with a reason.
- Uploads are validated by magic bytes, compressed on-device and queued while offline.
