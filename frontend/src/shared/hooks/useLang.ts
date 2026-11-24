import type { Bilingual } from "../api/contract";
import { usePrefs } from "../lib/prefs";

/** Pick the current language's side of a bilingual server string. */
export function useLang() {
  const lang = usePrefs((s) => s.language);
  return { lang, pick: (b: Bilingual | null | undefined) => (b ? b[lang] || b.en : "") };
}
