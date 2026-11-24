"""
Claim letter (PRD §7.1 'Claim letter'): Jinja2 fills the fixed parts per track and language;
the LLM writes only the short narrative from the user's own fields. A post-check then makes
sure every number and date in the letter exists in the claim data (rules.md §9).
"""

import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined
from pydantic import BaseModel

from app.rules.loader import Track

TEMPLATES = Path(__file__).parent / "templates"
_env = Environment(loader=FileSystemLoader(TEMPLATES), undefined=StrictUndefined, autoescape=False)  # noqa: S701  # plain-text letter, never HTML
NUMBER_RE = re.compile(r"\d[\d,./-]*\d|\d")


class LetterData(BaseModel):
    insurer: str
    tpa: str | None
    insurer_email: str
    today: str
    policy_no: str
    product: str
    name: str
    narrative: str
    clause_title: str
    clause_page: int
    amount: str
    enclosures: list[str]
    bank_last4: str


def render_letter(track: Track, lang: str, data: LetterData) -> str:
    """Render letter_{track}_{lang}.j2."""
    return _env.get_template(f"letter_{track.value}_{lang}.j2").render(**data.model_dump())


def _norm(token: str) -> str:
    """'18,640.00' and '18640' are the same amount."""
    plain = token.replace(",", "")
    return plain.rstrip("0").rstrip(".") if re.fullmatch(r"\d+\.\d+", plain) else plain


def unsupported_numbers(letter: str, claim_facts: list[str]) -> list[str]:
    """Numbers/dates in the letter that appear nowhere in the claim facts. Empty list = safe to send."""
    allowed = {_norm(t) for fact in claim_facts for t in NUMBER_RE.findall(fact)}
    # Enclosure list indices ("1.", "2.") are template structure, not claims.
    found = [_norm(t) for t in NUMBER_RE.findall(re.sub(r"(?m)^\d+\.\s", "", letter))]
    return sorted({t for t in found if t not in allowed})
