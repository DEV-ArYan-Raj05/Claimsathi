"""Bill arithmetic — always Python Decimal, never the LLM (rules.md §2.6, PRD §3.2)."""

from decimal import Decimal

from pydantic import BaseModel

TOLERANCE = Decimal("1.00")  # rupee rounding on handwritten bills


class BillItem(BaseModel):
    description: str
    qty: Decimal = Decimal("1")
    amount: Decimal


def sum_amounts(amounts: list[Decimal]) -> Decimal:
    """Exact sum, quantised to paise."""
    return sum(amounts, Decimal("0")).quantize(Decimal("0.01"))


def line_items_match_total(items: list[BillItem], stated_total: Decimal) -> bool:
    """True when the items add up to the stated total within ₹1."""
    return abs(sum_amounts([i.amount for i in items]) - stated_total) <= TOLERANCE
