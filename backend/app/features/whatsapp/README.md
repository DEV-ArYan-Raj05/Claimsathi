# whatsapp

PRD §3.8. `POST /webhooks/whatsapp` verifies the Twilio signature, then classifies STATUS / STOP / HELP. Message builders mask the policy number; idempotency key = `stage_id:kind`; quiet hours 21:00-08:00 IST except crop deadline alerts.

TODO: persist `whatsapp_messages`, STOP → `whatsapp_opt_in=false`, `notify_claim_update` worker.
