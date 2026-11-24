# tracker

Stage timeline and regulatory dates (PRD §3.5). `build_timeline` reads `deadlines` from the track YAML; overdue = earliest missed due date. Health overdue claims flag the 2%-above-bank-rate interest note.

TODO(PRD §6.2): `/claims/{id}/stages`, `/stages/parse`, `/escalation` routers; `claim_stages` (append-only) repository.
