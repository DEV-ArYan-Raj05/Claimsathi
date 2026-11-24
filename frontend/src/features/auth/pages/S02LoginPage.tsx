/**
 * S-02 Login: Google first; email + password (Supabase Auth); WhatsApp OTP for people without
 * Google; language picker. Wrapped in GuestOnly, which redirects as soon as a session exists.
 */
import { useTranslation } from "react-i18next";
import {
  IS_AUTH_MISCONFIGURED,
  IS_DEMO_AUTH,
  IS_SUPABASE_KEY_PRIVILEGED,
} from "@/shared/config/app";
import { useSession } from "@/shared/lib/session";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { AuthError, AuthScreen } from "../components/AuthScreen";
import { DemoSignIn } from "../components/DemoSignIn";
import { EmailSignInForm } from "../components/EmailSignInForm";
import { GoogleAndPhoneSignIn } from "../components/GoogleAndPhoneSignIn";

function OrDivider() {
  const { t } = useTranslation("auth");
  return (
    <div className="flex items-center gap-3 text-sm text-caption" aria-hidden>
      <span className="h-px flex-1 bg-ink/15" />
      {t("email.or")}
      <span className="h-px flex-1 bg-ink/15" />
    </div>
  );
}

export function S02LoginPage() {
  const { t } = useTranslation("auth");
  const reason = useSession((s) => s.signOutReason);

  if (IS_AUTH_MISCONFIGURED || IS_SUPABASE_KEY_PRIVILEGED)
    return (
      <AuthScreen title={t("login.title")}>
        <Card className="mt-6">
          <AuthError>
            {t(IS_SUPABASE_KEY_PRIVILEGED ? "errors.secretKeyInBrowser" : "errors.notConfigured")}
          </AuthError>
        </Card>
      </AuthScreen>
    );

  return (
    <AuthScreen title={t("login.title")} subtitle={t("login.subtitle")}>
      {reason && (
        <Card className="mt-6">
          <AuthError>{t(`session.${reason}`)}</AuthError>
        </Card>
      )}
      {IS_DEMO_AUTH && <DemoSignIn />}
      {IS_DEMO_AUTH && <p className="mt-6 text-sm text-caption-on-dominant">{t("demo.orOther")}</p>}
      <Card className={cn("space-y-4", IS_DEMO_AUTH ? "mt-2" : "mt-6")}>
        <GoogleAndPhoneSignIn
          between={
            IS_DEMO_AUTH ? undefined : (
              <>
                <OrDivider />
                <EmailSignInForm />
                <OrDivider />
              </>
            )
          }
        />
      </Card>
      <p className="mt-4 text-sm text-caption-on-dominant">{t("login.privacy")}</p>
    </AuthScreen>
  );
}
