# claim-pack

x-07 `/{track}/claims/:id/pack`. PRD §3.2.

- Endpoints: `POST /claims/{id}/pack`, `POST /claims/{id}/submit`
- Letter EN/HI toggle (independent of UI language). Totals come from the server, summed in code.
- "Send to insurer" (the one accent CTA) is replaced by a fix link while critical alerts are open.
- Sending opens the user's mail app with the letter; we never file into insurer systems. Share text masks the policy number.
- Print / Save as PDF uses the print stylesheet (shell hidden). TODO(PRD §5.2): WeasyPrint PDF from the backend.
