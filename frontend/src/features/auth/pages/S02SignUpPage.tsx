/**
 * S-02 Create account with email + password (Supabase Auth). With "Confirm email" on, the user
 * gets a link that lands on /auth/callback; otherwise they're signed in and GuestOnly moves them
 * to onboarding. The full name pre-fills S-03 through the profiles trigger.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { HAS_SUPABASE } from "@/shared/config/app";
import { resendConfirmation, signUpWithEmail } from "@/shared/lib/authEmail";
import { describeAuthError, handleAuthError, type AuthErrorInfo } from "@/shared/lib/authErrors";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/field";
import { AuthErrorMessage, AuthNotice, AuthScreen } from "../components/AuthScreen";
import { PasswordInput } from "../components/PasswordInput";
import { signUpSchema, type SignUpForm } from "../schemas";

const linkClass =
  "inline-flex min-h-tap items-center font-medium underline-offset-4 hover:underline";

function CheckEmail({ email }: { email: string }) {
  const { t } = useTranslation("auth");
  const [status, setStatus] = useState<"idle" | "sent" | AuthErrorInfo>("idle");
  const resend = async () => {
    try {
      await resendConfirmation(email);
      setStatus("sent");
    } catch (err) {
      setStatus(handleAuthError("resendConfirmation", err));
    }
  };
  return (
    <Card className="mt-6 space-y-4">
      <AuthNotice>{t("signup.checkEmail", { email })}</AuthNotice>
      <p className="text-sm text-caption">{t("signup.checkEmailHint")}</p>
      {status === "sent" && <AuthNotice>{t("email.resent")}</AuthNotice>}
      {typeof status === "object" && <AuthErrorMessage error={status} />}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void resend()}>
          {t("email.resend")}
        </Button>
        <Link to="/login" className={linkClass}>
          {t("signup.backToSignIn")}
        </Link>
      </div>
    </Card>
  );
}

export function S02SignUpPage() {
  const { t } = useTranslation("auth");
  const { state } = useLocation();
  const { register, handleSubmit, formState } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });
  const [error, setError] = useState<AuthErrorInfo | null>(
    HAS_SUPABASE ? null : describeAuthError(new Error("SUPABASE_NOT_CONFIGURED")),
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const fieldError = (key: keyof SignUpForm) => {
    const message = formState.errors[key]?.message;
    return message ? t(`fieldErrors.${message}`) : undefined;
  };

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const result = await signUpWithEmail({
        fullName: v.fullName,
        email: v.email,
        password: v.password,
      });
      if (result === "checkEmail") setSentTo(v.email);
    } catch (err) {
      setError(handleAuthError("signUp", err));
    }
  });

  return (
    <AuthScreen title={t("signup.title")} subtitle={t("signup.subtitle")}>
      {sentTo ? (
        <CheckEmail email={sentTo} />
      ) : (
        <Card className="mt-6">
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
            <Field id="su-name" label={t("signup.fullName")} error={fieldError("fullName")}>
              <Input id="su-name" autoComplete="name" {...register("fullName")} />
            </Field>
            <Field id="su-email" label={t("email.email")} error={fieldError("email")}>
              <Input
                id="su-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                {...register("email")}
              />
            </Field>
            <Field
              id="su-password"
              label={t("email.password")}
              hint={t("password.rules")}
              error={fieldError("password")}
            >
              <PasswordInput
                id="su-password"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
            <Field
              id="su-confirm"
              label={t("password.confirm")}
              error={fieldError("confirmPassword")}
            >
              <PasswordInput
                id="su-confirm"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </Field>
            {error && <AuthErrorMessage error={error} />}
            {error?.key === "emailTaken" && (
              <Link to="/forgot-password" state={state} className={linkClass}>
                {t("email.forgot")}
              </Link>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isBusy={formState.isSubmitting}
              disabled={!HAS_SUPABASE}
            >
              {t("signup.submit")}
            </Button>
          </form>
        </Card>
      )}
      <p className="mt-4 text-base text-on-dominant">
        {t("signup.haveAccount")}{" "}
        <Link to="/login" state={state} className={linkClass}>
          {t("signup.signIn")}
        </Link>
      </p>
    </AuthScreen>
  );
}
