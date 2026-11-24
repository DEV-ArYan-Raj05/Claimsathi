/** Shared frame for the S-02 sign-in screens: logo, title, language picker, then the card(s). */
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/shared/components/Navigation";
import { LANGUAGES } from "@/shared/config/app";
import { cn } from "@/shared/lib/cn";
import { usePrefs } from "@/shared/lib/prefs";
import type { AuthErrorInfo, AuthErrorKey } from "@/shared/lib/authErrors";

function LanguagePicker() {
  const { t } = useTranslation("auth");
  const { language, setLanguage } = usePrefs();
  return (
    <div role="radiogroup" aria-label={t("login.language")} className="mt-6 flex gap-2">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={language === l}
          onClick={() => setLanguage(l)}
          lang={l}
          className={cn(
            "min-h-tap flex-1 rounded-xl border-2 text-base font-medium",
            language === l
              ? "border-on-dominant bg-on-dominant text-dominant"
              : "border-on-dominant/40 text-on-dominant",
          )}
        >
          {t(`login.lang.${l}`)}
        </button>
      ))}
    </div>
  );
}

export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="on-dominant mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Logo className="text-on-dominant" />
      <h1 className="mt-8 text-4xl font-extrabold text-on-dominant">{title}</h1>
      {subtitle && <p className="mt-2 text-caption-on-dominant">{subtitle}</p>}
      <LanguagePicker />
      {children}
    </main>
  );
}

/** A confirmation inside a card ("Check your email", "Password changed"). Never accent-coloured. */
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 text-base text-ink">
      <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
      <span>{children}</span>
    </p>
  );
}

/** A form-level error (wrong password, rate limit…). Field errors use <Field error>. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-ink">
      {children}
    </p>
  );
}

/** For these, Supabase's own wording says more than our summary, so it's shown too. */
const SHOW_SUPABASE_MESSAGE: AuthErrorKey[] = [
  "generic",
  "serverUnavailable",
  "signupDatabaseError",
  "invalidApiKey",
];

/** A Supabase error: our plain-language summary, plus its code / HTTP status (and message). */
export function AuthErrorMessage({ error }: { error: AuthErrorInfo }) {
  const { t } = useTranslation("auth");
  const parts = [
    SHOW_SUPABASE_MESSAGE.includes(error.key) ? error.message : undefined,
    error.code ? t("errors.code", { code: error.code }) : undefined,
    error.status ? t("errors.status", { status: error.status }) : undefined,
  ].filter(Boolean);
  return (
    <div role="alert" className="space-y-1">
      <p className="text-sm font-medium text-ink">{t(`errors.${error.key}`)}</p>
      {parts.length > 0 && (
        <p className="break-words text-sm text-caption">
          {t("errors.details", { details: parts.join(" · ") })}
        </p>
      )}
    </div>
  );
}
