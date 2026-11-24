"""What the assistant knows (PRD §2 to §3.5, rules/{track}.yaml) and the 'Take me there' shortcut.

Facts come from the track YAML and the PRD only; the model is told to stay inside them.
"""

import re
from functools import cache
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.rules.loader import Track, load_rules

# Mirrors frontend/src/locales/en/documents.json → item.* (keep both in step).
DOC_LABELS = {
    "claim_form": "Signed claim form",
    "policy_copy": "Policy copy or e-card",
    "id_bank_proof": "ID proof and cancelled cheque or passbook",
    "bills": "Original bills with receipts (stamped and signed, with the doctor's registration number)",
    "prescriptions": "Prescriptions and pharmacy bills",
    "discharge_summary": "Discharge summary",
    "investigation_reports": "Test and investigation reports",
    "fir_mlc": "FIR or MLC (accidents only)",
    "intimation_docket": "Loss intimation docket number",
    "pmfby_policy": "PMFBY application or policy",
    "aadhaar_passbook": "Aadhaar and bank passbook",
    "geo_photos": "Geotagged photos of the damaged field, taken within 72 hours",
    "land_record": "Land record (Khasra / Khatauni / Jamabandi)",
    "sowing_cert": "Sowing certificate or crop declaration",
    "premium_proof": "Premium payment proof",
}

# PRD §3.5 regulatory timelines that the YAML encodes as hours.
TRACK_FACTS = {
    Track.HEALTH: [
        "The insurer or TPA should settle or reject within 30 days of the last necessary document "
        "(up to 45 days if they investigate). Late settlement attracts interest at 2% above the bank rate.",
        "Waiting periods (often 30 days initially, longer for some diseases) and exclusions "
        "are in the policy.",
    ],
    Track.CROP: [
        "Report crop loss through the Crop Insurance App, the 14447 helpline, your bank "
        "or the agriculture office.",
        "A surveyor should be appointed within 48 hours of the report, and the claim paid within 15 days of "
        "the survey report, subject to premium and government subsidy being received.",
    ],
}
ESCALATION = {
    "grievance_cell": "the insurer's grievance cell",
    "bima_bharosa": "Bima Bharosa (IRDAI)",
    "district_agri_office": "the district agriculture office",
    "helpline_14447": "the 14447 crop insurance helpline",
}
STAGE_WORDS = {"event": "the loss event", "submitted": "submission", "loss_reported": "the loss report"}

_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "prompts"),
    undefined=StrictUndefined,
    autoescape=False,  # noqa: S701 - plain-text prompt, never rendered as HTML
    keep_trailing_newline=True,
)


def _duration(hours: int) -> str:
    """72 → '72 hours', 360 → '15 days' (how the PRD and regulators phrase them)."""
    return f"{hours // 24} days" if hours > 72 and hours % 24 == 0 else f"{hours} hours"


@cache
def system_prompt(track: Track) -> str:
    """The grounded system prompt for one track (cached; the YAML is read once)."""
    rules = load_rules(track)
    deadlines = [
        f"{d.stage.replace('_', ' ').capitalize()} is due within {_duration(d.hours)} of "
        f"{STAGE_WORDS.get(d.from_, d.from_.replace('_', ' '))}."
        for d in rules.deadlines
    ]
    return _env.get_template("system.md.j2").render(
        track_name="Health (including accident)" if track is Track.HEALTH else "Crop",
        intimation_hours=rules.intimation_window_hours,
        deadline_lines=deadlines,
        documents=[DOC_LABELS.get(i.code, i.code.replace("_", " ")) for i in rules.checklist],
        track_facts=TRACK_FACTS[track],
        escalation=", then ".join(ESCALATION.get(c, c.replace("_", " ")) for c in rules.escalation_channels),
    )


# Same four intents as the demo (PRD §3.6), matched on the user's words, English or Hindi.
_INTENTS: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"missing|which document|what document|बाकी|कौन सा|दस्तावेज़", re.I), "missing_docs", "claims"),
    (
        re.compile(r"where is my claim|claim status|status of my claim|कहाँ|स्थिति", re.I),
        "claim_status",
        "claims",
    ),
    (
        re.compile(r"start a claim|new claim|file a claim|report (crop )?(loss|damage)|नया क्लेम|शुरू", re.I),
        "start_claim",
        "claims/new",
    ),
    (
        re.compile(r"what does my policy cover|is .* covered|my policy|cover|कवर|पॉलिसी", re.I),
        "policy_cover",
        "policies",
    ),
]


def suggest_route(texts: list[str], track: Track) -> tuple[str, str | None]:
    """(intent, in-app route) for the 'Take me there' button, from the user's own words."""
    for pattern, intent, path in _INTENTS:
        if any(pattern.search(t) for t in texts):
            return intent, f"/{track.value}/{path}"
    return "unknown", None


_PROMISE = re.compile(
    r"\b(will|shall|is going to|are going to)\s+(definitely\s+|surely\s+|certainly\s+)?(be\s+)?"
    r"(approved|accepted|paid|settled|sanctioned)\b|\bguarantee[sd]?\b|\b100\s?%\s+(sure|certain)\b",
    re.I,
)
NO_PROMISE_NOTE = (
    "Please note: ClaimSathi cannot promise that any claim will be approved. Only the insurer decides."
)


def guard_answer(answer: str) -> str:
    """rules.md §9: never predict or promise approval — add the correction if the model slipped."""
    return f"{answer}\n\n{NO_PROMISE_NOTE}" if _PROMISE.search(answer) else answer
