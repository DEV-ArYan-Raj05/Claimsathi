/** S-02 Forgot password: Supabase emails a recovery link that opens /reset-password. */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HAS_SUPABASE } from "@/shared/config/app";
import { sendPasswordReset } from "@/shared/lib/authEmail";
import { describeAuthError, handleAuthError, type AuthErrorInfo } from "@/shared/lib/authErrors";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/field";
import { AuthErrorMessage, AuthNotice, AuthScreen } from "../components/AuthScreen";
import { forgotPasswordSchema, type ForgotPasswordForm } from "../schemas";

const linkClass =
  "inline-flex min-h-tap items-center font-medium underline-offset-4 hover:underline";

export function S02ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { register, handleSubmit, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const [error, setError] = useState<AuthErrorInfo | null>(
    HAS_SUPABASE ? null : describeAuthError(new Error("SUPABASE_NOT_CONFIGURED")),
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailError = formState.errors.email?.message;

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await sendPasswordReset(email);
      setSentTo(email);
    } catch (err) {
      setError(handleAuthError("sendPasswordReset", err));
    }
  });

  return (
    <AuthScreen title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      <Card className="mt-6 space-y-4">
        {sentTo ? (
          <>
            {/* Same message whether or not the email has an account, so accounts can't be probed. */}
            <AuthNotice>{t("forgot.sent", { email: sentTo })}</AuthNotice>
            <p className="text-sm text-caption">{t("forgot.sentHint")}</p>
          </>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
            <Field
              id="fp-email"
              label={t("email.email")}
              error={emailError ? t(`fieldErrors.${emailError}`) : undefined}
            >
              <Input
                id="fp-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                {...register("email")}
              />
            </Field>
            {error && <AuthErrorMessage error={error} />}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isBusy={formState.isSubmitting}
              disabled={!HAS_SUPABASE}
            >
              {t("forgot.submit")}
            </Button>
          </form>
        )}
        <Link to="/login" className={linkClass}>
          {t("signup.backToSignIn")}
        </Link>
      </Card>
    </AuthScreen>
  );
}
