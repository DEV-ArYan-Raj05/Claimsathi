from app.features.claim_pack import LetterData, render_letter, unsupported_numbers
from app.rules.loader import Track

DATA = LetterData(
    insurer="Jan Suraksha Health Insurance (demo)",
    tpa="MedAssist TPA (demo)",
    insurer_email="claims@example.in",
    today="24 Nov 2026",
    policy_no="JSH/MH/2026/00418823",
    product="Parivar Micro Health",
    name="Sunita Devi",
    narrative="Raju Kumar was admitted to Shree Sai Clinic on 17 Nov 2026.",
    clause_title="Hospitalisation",
    clause_page=2,
    amount="₹18,640",
    enclosures=["Original bills", "Prescriptions"],
    bank_last4="4417",
)
FACTS = ["JSH/MH/2026/00418823", "17 Nov 2026", "24 Nov 2026", "18640.00", "4417", "page 2"]


def test_all_templates_render_in_both_languages() -> None:
    for track in Track:
        for lang in ("en", "hi"):
            letter = render_letter(track, lang, DATA)
            assert DATA.policy_no in letter and "4417" in letter


def test_letter_numbers_all_come_from_claim_data() -> None:
    assert unsupported_numbers(render_letter(Track.HEALTH, "en", DATA), FACTS) == []


def test_invented_number_is_flagged() -> None:
    bad = render_letter(Track.HEALTH, "en", DATA.model_copy(update={"amount": "₹25,000"}))
    assert unsupported_numbers(bad, FACTS) == ["25000"]
