/**
 * S-02 (PRD §3.7): "Continue with Google", and WhatsApp OTP for people without Google.
 * Moved out of S02LoginPage unchanged in behaviour; the GuestOnly guard redirects once signed in.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IS_DEMO_AUTH } from "@/shared/config/app";
import { handleAuthError } from "@/shared/lib/authErrors";
import { sendSignInOtp, signInWithGoogle, verifySignInOtp } from "@/shared/lib/session";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";

function GoogleMark() {
  // Google "G" outline in the current text colour (no brand hex in components).
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path
        d="M20.5 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.8a4.6 4.6 0 0 1-2 3A7 7 0 1 1 16.7 7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `between` renders under the Google button in the first step (the email form in real mode). */
export function GoogleAndPhoneSignIn({ between }: { between?: ReactNode }) {
  const { t } = useTranslation("auth");
  const [mode, setMode] = useState<"google" | "phone" | "code">("google");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const run = async (fn: () => Promise<void>, fallbackKey = "login.failed") => {
    setError(null);
    setIsBusy(true);
    try {
      await fn();
    } catch (err) {
      const info = handleAuthError("googleOrPhoneSignIn", err);
      const summary = info.key === "generic" ? t(fallbackKey) : t(`errors.${info.key}`);
      const detail = [info.key === "generic" ? info.message : undefined, info.code, info.status]
        .filter(Boolean)
        .join(" · ");
      setError(detail ? `${summary} (${detail})` : summary);
    } finally {
      setIsBusy(false);
    }
  };

  if (mode === "google")
    return (
      <>
        <Button
          variant="solid"
          className="w-full"
          isBusy={isBusy}
          onClick={() => void run(signInWithGoogle)}
        >
          <GoogleMark />
          {t("login.google")}
        </Button>
        {error && (
          <p role="alert" className="text-sm font-medium text-ink">
            {error}
          </p>
        )}
        {between}
        <Button variant="quiet" className="w-full" onClick={() => setMode("phone")}>
          {t("login.usePhone")}
        </Button>
      </>
    );

  if (mode === "phone")
    return (
      <>
        <Field
          id="login-phone"
          label={t("login.phoneLabel")}
          hint={t("login.phoneHint")}
          error={error ?? undefined}
        >
          <Input
            id="login-phone"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Button
          variant="solid"
          className="w-full"
          isBusy={isBusy}
          onClick={() =>
            void run(async () => {
              await sendSignInOtp(phone);
              setMode("code");
            })
          }
        >
          {t("login.sendCode")}
        </Button>
        <Button variant="quiet" className="w-full" onClick={() => setMode("google")}>
          {t("login.useGoogle")}
        </Button>
      </>
    );

  return (
    <>
      <Field
        id="login-code"
        label={t("login.codeLabel", { phone })}
        hint={IS_DEMO_AUTH ? t("demoCodeHint") : undefined}
        error={error ?? undefined}
      >
        <Input
          id="login-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <Button
        variant="primary"
        className="w-full"
        isBusy={isBusy}
        disabled={code.length !== 6}
        onClick={() => void run(() => verifySignInOtp(phone, code))}
      >
        {t("login.verify")}
      </Button>
    </>
  );
}
