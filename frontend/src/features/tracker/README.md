# tracker

x-09 `/{track}/claims/:id`. PRD §3.5, §3.8.

- Endpoints: `GET /claims/{id}`, `POST /claims/{id}/stages`, `POST /claims/{id}/stages/parse`, `GET /claims/{id}/escalation`, `GET /claims/{id}/whatsapp-log`
- Due dates come from the deadline rules in track config/YAML (health: decision 30 days after submission; crop: 72 h report, 48 h surveyor, 15 days payment after survey).
- Overdue stage turns accent and offers an escalation letter. Timeline draws in on scroll (transform/opacity only).
