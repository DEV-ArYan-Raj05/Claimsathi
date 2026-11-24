from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from app.features.documents import (
    BillItem,
    ExtractedDocument,
    line_items_match_total,
    run_checks,
    sum_amounts,
)
from app.features.documents.service_checks import REGISTRY, CheckContext
from app.rules.loader import Track, load_rules

EVENT = datetime(2026, 11, 20, 6, tzinfo=UTC)
CTX = CheckContext(
    insured_names=["Sunita Devi", "Raju Kumar"],
    policy_start=date(2026, 4, 1),
    policy_end=date(2027, 3, 31),
    event_at=EVENT,
    intimated_at=EVENT + timedelta(hours=20),
    policy_survey_nos=["112/4"],
    other_phashes=["abc"],
)

CLEAN_BILL = ExtractedDocument(
    has_stamp=True,
    has_signature=True,
    doctor_reg_no="DMC/R/12345",
    provider_name="Shree Sai Clinic",
    patient_name="Raju Kumaar",
    bill_date=date(2026, 11, 18),
    bill_no="SS/1182",
    items=[
        BillItem(description="Room", amount=Decimal("6000")),
        BillItem(description="Doctor", amount=Decimal("3600")),
    ],
    stated_total=Decimal("9600"),
    ocr_confidence=0.82,
    phash="zzz",
)


def failing(doc: ExtractedDocument, item: str = "bills", track: Track = Track.HEALTH) -> set[str]:
    return {o.code for o in run_checks(track, item, doc, CTX) if not o.passed}


def test_every_yaml_check_has_a_function() -> None:
    for track in Track:
        for specs in load_rules(track).checks.values():
            assert all(s.code in REGISTRY for s in specs)


def test_clean_bill_passes_everything() -> None:
    assert failing(CLEAN_BILL) == set()


def test_prd_demo_defects_are_caught() -> None:
    assert failing(CLEAN_BILL.model_copy(update={"has_stamp": False})) == {"BILL_STAMP_MISSING"}
    assert failing(CLEAN_BILL.model_copy(update={"doctor_reg_no": None})) == {"DOCTOR_REG_MISSING"}
    assert failing(CLEAN_BILL.model_copy(update={"stated_total": Decimal("9800")})) == {"BILL_TOTAL_MISMATCH"}
    assert failing(CLEAN_BILL.model_copy(update={"bill_date": None})) == {"BILL_DATE_OUTSIDE_POLICY"}
    assert failing(CLEAN_BILL.model_copy(update={"patient_name": "Mohan Lal"})) == {"PATIENT_NAME_MISMATCH"}
    assert failing(CLEAN_BILL.model_copy(update={"has_signature": False})) == {"BILL_SIGNATURE_MISSING"}
    assert failing(CLEAN_BILL.model_copy(update={"phash": "abc"})) == {"DUPLICATE_BILL"}
    assert failing(CLEAN_BILL.model_copy(update={"ocr_confidence": 0.4})) == {"LOW_LEGIBILITY"}


def test_crop_photo_rules() -> None:
    good = ExtractedDocument(
        has_gps=True, is_inside_plot_area=True, photo_taken_at=EVENT + timedelta(hours=5)
    )
    assert failing(good, "geo_photos", Track.CROP) == set()
    old = good.model_copy(update={"photo_taken_at": EVENT - timedelta(days=10)})
    assert failing(old, "geo_photos", Track.CROP) == {"PHOTO_OUTSIDE_72H"}
    assert failing(good.model_copy(update={"has_gps": False}), "geo_photos", Track.CROP) == {
        "PHOTO_NOT_GEOTAGGED"
    }


def test_land_record_rules() -> None:
    rec = ExtractedDocument(survey_no="112 /4", land_owner_name="Sunita Devi")
    assert failing(rec, "land_record", Track.CROP) == set()
    assert failing(rec.model_copy(update={"survey_no": "87/2"}), "land_record", Track.CROP) == {
        "SURVEY_NO_MISMATCH"
    }


def test_bill_totals_are_exact() -> None:
    assert sum_amounts([Decimal("0.10"), Decimal("0.20")]) == Decimal("0.30")
    items = [
        BillItem(description="a", amount=Decimal("100.40")),
        BillItem(description="b", amount=Decimal("49.25")),
    ]
    assert line_items_match_total(items, Decimal("150"))
    assert not line_items_match_total(items, Decimal("152"))
