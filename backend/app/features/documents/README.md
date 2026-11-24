# documents

Document checks (PRD §3.3). `run_checks(track, item, doc, ctx)` runs the checks the YAML lists for a checklist item. Add a check = YAML entry + one `@register("CODE")` function. Bill totals use Decimal with a ₹1 tolerance.

TODO(PRD §7.1): `check_document` job (OCR → classify → extract → run_checks), `/claims/{id}/documents`, overrides. Swap `names_match` for rapidfuzz + indic-transliteration.
