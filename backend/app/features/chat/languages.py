"""Languages the assistant can answer in: English + the 22 scheduled Indian languages that
sarvam-translate:v1 supports (Sarvam SDK TranslateTargetLanguage). Codes are Sarvam's BCP-47 forms."""

from typing import Literal, get_args

LanguageCode = Literal[
    "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN",
    "te-IN", "as-IN", "brx-IN", "doi-IN", "kok-IN", "ks-IN", "mai-IN", "mni-IN", "ne-IN", "sa-IN",
    "sat-IN", "sd-IN", "ur-IN",
]  # fmt: skip

SUPPORTED_LANGUAGES: frozenset[str] = frozenset(get_args(LanguageCode))
ENGLISH = "en-IN"
