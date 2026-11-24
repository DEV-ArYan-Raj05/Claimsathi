/** S-02 email + password sign-in (Supabase Auth). The GuestOnly guard redirects once signed in. */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { resendConfirmation, signInWithEmail } from "@/shared/lib/authEmail";
import { handleAuthError, type AuthErrorInfo } from "@/shared/lib/authErrors";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { signInSchema, type SignInForm } from "../schemas";
import { AuthErrorMessage, AuthNotice } from "./AuthScreen";
import { PasswordInput } from "./PasswordInput";

export function EmailSignInForm() {
  const { t } = useTranslation("auth");
  const { state } = useLocation(); // keeps `from` when moving between S-02 screens
  const { register, handleSubmit, formState, getValues } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [isResent, setIsResent] = useState(false);
  const fieldError = (key: keyof SignInForm) => {
    const message = formState.errors[key]?.message;
    return message ? t(`fieldErrors.${message}`) : undefined;
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    setIsResent(false);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(handleAuthError("signIn", err));
    }
  });

  const resend = async () => {
    try {
      await resendConfirmation(getValues("email").trim().toLowerCase());
      setError(null);
      setIsResent(true);
    } catch (err) {
      setError(handleAuthError("resendConfirmation", err));
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
      <Field id="si-email" label={t("email.email")} error={fieldError("email")}>
        <Input
          id="si-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={Boolean(formState.errors.email)}
          {...register("email")}
        />
      </Field>
      <Field id="si-password" label={t("email.password")} error={fieldError("password")}>
        <PasswordInput
          id="si-password"
          autoComplete="current-password"
          aria-invalid={Boolean(formState.errors.password)}
          {...register("password")}
        />
      </Field>
      {error && <AuthErrorMessage error={error} />}
      {error?.key === "emailNotConfirmed" && (
        <Button variant="outline" className="w-full" onClick={() => void resend()}>
          {t("email.resend")}
        </Button>
      )}
      {isResent && <AuthNotice>{t("email.resent")}</AuthNotice>}
      <Button type="submit" variant="solid" className="w-full" isBusy={formState.isSubmitting}>
        {t("email.signIn")}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-base">
        <Link
          to="/forgot-password"
          state={state}
          className="min-h-tap inline-flex items-center underline-offset-4 hover:underline"
        >
          {t("email.forgot")}
        </Link>
        <Link
          to="/signup"
          state={state}
          className="min-h-tap inline-flex items-center font-medium underline-offset-4 hover:underline"
        >
          {t("email.createAccount")}
        </Link>
      </div>
    </form>
  );
}
