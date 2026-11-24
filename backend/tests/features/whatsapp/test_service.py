import base64
import hashlib
import hmac
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.core.security import verify_twilio_signature
from app.features.whatsapp import is_quiet_hours, parse_inbound, stage_changed_message
from app.features.whatsapp.service import InboundAction


def test_quiet_hours_in_ist_with_crop_deadline_exempt() -> None:
    late_night_ist = datetime(2026, 11, 24, 17, 0, tzinfo=UTC)  # 22:30 IST
    assert is_quiet_hours(late_night_ist, "stage_changed")
    assert not is_quiet_hours(late_night_ist, "deadline_countdown")
    assert not is_quiet_hours(datetime(2026, 11, 24, 6, 0, tzinfo=UTC), "stage_changed")  # 11:30 IST


def test_message_masks_policy_and_is_idempotent_per_stage() -> None:
    m = stage_changed_message("stg_1", "PMFBY/HR/RBI/2026/7781245", "Surveyor appointed", "26 Nov")
    assert m.variables["ref"] == "••••1245"
    assert m.idempotency_key == "stg_1:stage_changed"


def test_inbound_keywords() -> None:
    assert parse_inbound(" stop please") is InboundAction.STOP
    assert parse_inbound("STATUS") is InboundAction.STATUS
    assert parse_inbound("") is InboundAction.UNKNOWN


def test_webhook_rejects_bad_signature(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secret")
    from app.core.config import get_settings

    get_settings.cache_clear()
    from app.main import app

    client = TestClient(app)
    res = client.post("/webhooks/whatsapp", data={"Body": "STOP"}, headers={"X-Twilio-Signature": "nope"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "SIGNATURE_INVALID"
    url = "http://testserver/webhooks/whatsapp"
    sig = base64.b64encode(hmac.new(b"secret", (url + "BodySTOP").encode(), hashlib.sha1).digest()).decode()
    assert verify_twilio_signature("secret", url, {"Body": "STOP"}, sig)
    ok = client.post("/webhooks/whatsapp", data={"Body": "STOP"}, headers={"X-Twilio-Signature": sig})
    assert ok.status_code == 200 and ok.json() == {"action": "stop"}
