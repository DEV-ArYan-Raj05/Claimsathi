/**
 * /auth/callback — landing for Google OAuth and email-confirmation links. supabase-js reads the
 * session from the URL while the app boots (session.ts); GuestOnly then routes the user on. If no
 * session came through (expired or already-used link, cancelled Google consent) we say so.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { readAuthLinkError } from "@/shared/lib/authErrors";
import { Card } from "@/shared/ui/card";
import { AuthError, AuthScreen } from "../components/AuthScreen";
import { GuestOnly } from "../components/GuestOnly";

export function AuthCallbackPage() {
  const { t } = useTranslation("auth");
  const linkError = useMemo(() => readAuthLinkError(), []);
  return (
    <GuestOnly>
      <AuthScreen title={t("callback.failedTitle")}>
        <Card className="mt-6 space-y-4">
          <AuthError>{t(`errors.${linkError ?? "linkExpired"}`)}</AuthError>
          <Link
            to="/login"
            className="inline-flex min-h-tap items-center font-medium underline-offset-4 hover:underline"
          >
            {t("signup.backToSignIn")}
          </Link>
        </Card>
      </AuthScreen>
    </GuestOnly>
  );
}
