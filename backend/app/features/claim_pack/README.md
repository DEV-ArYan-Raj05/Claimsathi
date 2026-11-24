# claim_pack

Claim letter (PRD §3.2, §7.1). Jinja2 `letter_{track}_{lang}.j2` fills fixed parts; the LLM writes only the narrative. `unsupported_numbers()` must return `[]` before a letter is shown.

TODO: `build_pack` job, WeasyPrint PDF with Noto Sans Devanagari.
