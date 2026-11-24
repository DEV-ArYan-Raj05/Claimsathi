/**
 * Demo-mode email + password sign-in with the test accounts listed (demo/accounts.ts).
 * Only rendered when Supabase isn't configured — real mode signs in through Supabase Auth only
 * (rules.md §11).
 */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { DEMO_ACCOUNTS } from "@/shared/lib/demo/accounts";
import { signInWithDemoAccount } from "@/shared/lib/session";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/field";

/** The GuestOnly guard on /login sends the account to its home once signed in. */
export function DemoSignIn() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      await signInWithDemoAccount(email, password);
    } catch {
      setError(t("demo.failed"));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card className="mt-6 space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">{t("demo.title")}</h2>
        <p className="mt-1 text-sm text-caption">{t("demo.subtitle")}</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => void submit(e)} noValidate>
        <Field id="demo-email" label={t("demo.email")}>
          <Input
            id="demo-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="demo-password" label={t("demo.password")} error={error ?? undefined}>
          <Input
            id="demo-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="solid"
          className="w-full"
          isBusy={isBusy}
          disabled={!email || !password}
        >
          {t("demo.signIn")}
        </Button>
      </form>

      <div>
        <p className="text-sm font-medium">{t("demo.pick")}</p>
        <ul className="mt-2 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                  setError(null);
                }}
                className="min-h-tap w-full rounded-xl border-2 border-ink/15 px-4 py-2 text-left hover:border-ink/40"
              >
                <span className="block text-base font-medium">{t(`demo.accounts.${a.id}`)}</span>
                <span className="block text-sm tabular-nums text-caption">
                  {a.email} · {a.password}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
