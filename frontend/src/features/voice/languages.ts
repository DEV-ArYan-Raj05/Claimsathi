/**
 * Reply languages for the assistant: English + the 22 scheduled Indian languages that Sarvam
 * Translate supports. Mirrors backend/app/features/chat/languages.py. Names are endonyms, so each
 * person can find their own language whatever the UI language is.
 */
import type { Language } from "@/shared/config/app";

export const CHAT_LANGUAGES = [
  { code: "en-IN", name: "English" },
  { code: "hi-IN", name: "हिंदी" },
  { code: "bn-IN", name: "বাংলা" },
  { code: "gu-IN", name: "ગુજરાતી" },
  { code: "kn-IN", name: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "മലയാളം" },
  { code: "mr-IN", name: "मराठी" },
  { code: "od-IN", name: "ଓଡ଼ିଆ" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ" },
  { code: "ta-IN", name: "தமிழ்" },
  { code: "te-IN", name: "తెలుగు" },
  { code: "as-IN", name: "অসমীয়া" },
  { code: "brx-IN", name: "बड़ो" },
  { code: "doi-IN", name: "डोगरी" },
  { code: "kok-IN", name: "कोंकणी" },
  { code: "ks-IN", name: "کٲشُر" },
  { code: "mai-IN", name: "मैथिली" },
  { code: "mni-IN", name: "মৈতৈলোন্" },
  { code: "ne-IN", name: "नेपाली" },
  { code: "sa-IN", name: "संस्कृतम्" },
  { code: "sat-IN", name: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd-IN", name: "سنڌي" },
  { code: "ur-IN", name: "اردو" },
] as const;

export type ChatLanguage = (typeof CHAT_LANGUAGES)[number]["code"];

const CODES: readonly string[] = CHAT_LANGUAGES.map((l) => l.code);

export function isChatLanguage(value: unknown): value is ChatLanguage {
  return typeof value === "string" && CODES.includes(value);
}

/** The app's UI language as an assistant language (en → en-IN, hi → hi-IN). */
export const fromAppLanguage = (lang: Language): ChatLanguage =>
  lang === "hi" ? "hi-IN" : "en-IN";

/** Right-to-left scripts (Urdu, Kashmiri, Sindhi) need dir="rtl" on their messages. */
export const isRtl = (code: string) => ["ur-IN", "ks-IN", "sd-IN"].includes(code);

/** Browser speech uses "or-IN" for Odia; Sarvam uses "od-IN". */
export const toSpeechLang = (code: string) => (code === "od-IN" ? "or-IN" : code);
