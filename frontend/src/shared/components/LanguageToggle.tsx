import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePrefs } from "../lib/prefs";
import { cn } from "../lib/cn";

/** EN ⇄ हिं. The label shows the language you'd switch TO, in that language. */
export function LanguageToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { language, setLanguage } = usePrefs();
  const next = language === "en" ? "hi" : "en";
  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      aria-label={t("language.switchTo")}
      className={cn(
        "inline-flex min-h-tap min-w-tap items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium",
        className,
      )}
    >
      <Languages aria-hidden className="h-4 w-4" />
      <span lang={next}>{t("language.other")}</span>
    </button>
  );
}
