/**
 * Verify a WhatsApp number (PRD §3.7): updateUser({ phone }) → 6-digit code on WhatsApp →
 * verifyOtp(phone_change) → POST /me/whatsapp/confirm. Used on S-03 and x-11.
 */
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IS_DEMO_AUTH } from "@/shared/config/app";
import { sendNumberOtp, verifyNumberOtp } from "@/shared/lib/session";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { useConfirmWhatsApp } from "../hooks/useProfile";

const PHONE_RE = /^\+91[6-9]\d{9}$/;

export function WhatsAppVerify({ verifiedPhone }: { verifiedPhone: string | null }) {
  const { t } = useTranslation("auth");
  const confirm = useConfirmWhatsApp();
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (verifiedPhone) {
    return (
      <p className="flex items-center gap-2 text-base text-ink">
        <CheckCircle2 aria-hidden className="h-5 w-5 text-success" />
        {t("whatsapp.verified", { phone: verifiedPhone })}
      </p>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setIsBusy(true);
    try {
      await fn();
    } catch {
      setError(t("whatsapp.failed"));
    } finally {
      setIsBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!PHONE_RE.test(phone.replace(/\s/g, ""))) throw new Error("bad phone");
      await sendNumberOtp(phone);
      setStep("code");
    });

  const verify = () =>
    run(async () => {
      await verifyNumberOtp(phone, code);
      await confirm.mutateAsync(phone);
    });

  return step === "phone" ? (
    <div className="space-y-3">
      <Field
        id="wa-phone"
        label={t("whatsapp.phoneLabel")}
        hint={t("whatsapp.phoneHint")}
        error={error ?? undefined}
      >
        <Input
          id="wa-phone"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Button variant="solid" isBusy={isBusy} onClick={() => void sendCode()}>
        {t("whatsapp.sendCode")}
      </Button>
    </div>
  ) : (
    <div className="space-y-3">
      <Field
        id="wa-code"
        label={t("whatsapp.codeLabel", { phone })}
        hint={IS_DEMO_AUTH ? t("demoCodeHint") : undefined}
        error={error ?? undefined}
      >
        <Input
          id="wa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="solid"
          isBusy={isBusy}
          disabled={code.length !== 6}
          onClick={() => void verify()}
        >
          {t("whatsapp.verify")}
        </Button>
        <Button variant="quiet" onClick={() => setStep("phone")}>
          {t("whatsapp.changeNumber")}
        </Button>
      </div>
    </div>
  );
}
