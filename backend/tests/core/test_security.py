from app.core.security import mask_aadhaar_text, mask_tail


def test_aadhaar_is_masked_in_any_spacing() -> None:
    assert mask_aadhaar_text("Aadhaar 2345 6789 0123 issued") == "Aadhaar XXXX XXXX 0123 issued"
    assert mask_aadhaar_text("234567890123") == "XXXX XXXX 0123"
    assert mask_aadhaar_text("phone 98765 43210") == "phone 98765 43210"


def test_mask_tail() -> None:
    assert mask_tail("1234 5678 9012 4417") == "••••4417"
