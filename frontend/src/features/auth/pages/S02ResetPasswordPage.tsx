/**
 * S-02 Reset password. Opened from the recovery email: supabase-js turns the link into a short
 * recovery session, the user sets a new password, then we sign out so they sign in with it.
 * Not wrapped in GuestOnly — the recovery session counts as signed in.
 */
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { updatePassword } from "@/shared/lib/authEmail";
import { handleAuthError, readAuthLinkError, type AuthErrorInfo } from "@/shared/lib/authErrors";
import { signOut, useSession } from "@/shared/lib/session";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { AuthError, AuthErrorMessage, AuthNotice, AuthScreen } from "../components/AuthScreen";
import { AuthLoading } from "../components/GuestOnly";
import { PasswordInput } from "../components/PasswordInput";
import { resetPasswordSchema, type ResetPasswordForm } from "../schemas";

const linkClass =
  "inline-flex min-h-tap items-center font-medium underline-offset-4 hover:underline";

function ResetForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation("auth");
  const { register, handleSubmit, formState } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const fieldError = (key: keyof ResetPasswordForm) => {
    const message = formState.errors[key]?.message;
    return message ? t(`fieldErrors.${message}`) : undefined;
  };
  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await updatePassword(password);
      onDone();
      await signOut();
    } catch (err) {
      setError(handleAuthError("updatePassword", err));
    }
  });
  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
      <Field
        id="rp-password"
        label={t("reset.newPassword")}
        hint={t("password.rules")}
        error={fieldError("password")}
      >
        <PasswordInput id="rp-password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field id="rp-confirm" label={t("password.confirm")} error={fieldError("confirmPassword")}>
        <PasswordInput
          id="rp-confirm"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </Field>
      {error && <AuthErrorMessage error={error} />}
      <Button type="submit" variant="primary" className="w-full" isBusy={formState.isSubmitting}>
        {t("reset.submit")}
      </Button>
    </form>
  );
}

export function S02ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const { isReady, isSignedIn } = useSession();
  const linkError = useMemo(() => readAuthLinkError(), []);
  const [isDone, setIsDone] = useState(false);

  if (!isReady && !isDone) return <AuthLoading />;

  let body;
  if (isDone) {
    body = (
      <>
        <AuthNotice>{t("reset.done")}</AuthNotice>
        <Link to="/login" className={linkClass}>
          {t("signup.signIn")}
        </Link>
      </>
    );
  } else if (!isSignedIn) {
    body = (
      <>
        <AuthError>{t(`errors.${linkError ?? "linkExpired"}`)}</AuthError>
        <Link to="/forgot-password" className={linkClass}>
          {t("reset.requestNew")}
        </Link>
      </>
    );
  } else {
    body = <ResetForm onDone={() => setIsDone(true)} />;
  }

  return (
    <AuthScreen title={t("reset.title")} subtitle={isDone ? undefined : t("reset.subtitle")}>
      <Card className="mt-6 space-y-4">{body}</Card>
    </AuthScreen>
  );
}
