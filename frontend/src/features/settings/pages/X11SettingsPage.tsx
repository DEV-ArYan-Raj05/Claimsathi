/** x-11 Profile and settings: language, people/land, bank (masked), WhatsApp + calls, Google, data. */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  deleteMe,
  useProfile,
  useUpdateProfile,
  useWhatsAppOptIn,
  WhatsAppVerify,
} from "@/features/auth";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { LANGUAGES } from "@/shared/config/app";
import { usePrefs } from "@/shared/lib/prefs";
import { linkGoogle, signOut } from "@/shared/lib/session";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/field";
import { MembersCard, ParcelsCard } from "../components/PeopleAndLand";

export function X11SettingsPage() {
  const { t } = useTranslation("settings");
  const profile = useProfile();
  const update = useUpdateProfile();
  const optIn = useWhatsAppOptIn();
  const { language, setLanguage } = usePrefs();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(profile.data, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "claimsathi-profile.json",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = async () => {
    await deleteMe();
    qc.clear();
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <QueryView query={profile}>
      {(p) => (
        <>
          <PageHeader title={t("title")} subtitle={p.email} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="text-xl font-bold">{t("language.title")}</h2>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <Button
                    key={l}
                    variant={language === l ? "solid" : "outline"}
                    aria-pressed={language === l}
                    lang={l}
                    onClick={() => {
                      setLanguage(l);
                      update.mutate({ language: l });
                    }}
                  >
                    {t(`language.${l}`)}
                  </Button>
                ))}
              </div>
            </Card>
            <Card className="space-y-3">
              <h2 className="text-xl font-bold">{t("bank.title")}</h2>
              <p className="text-lg">
                {p.bank_last4 ? t("bank.masked", { last4: p.bank_last4 }) : t("bank.none")}
              </p>
              <p className="text-sm text-caption">{t("bank.note")}</p>
            </Card>
            <MembersCard />
            <ParcelsCard />
            <Card className="space-y-3">
              <h2 className="text-xl font-bold">{t("whatsapp.title")}</h2>
              <WhatsAppVerify verifiedPhone={p.whatsapp_verified_at ? p.whatsapp_phone : null} />
              <Checkbox
                id="set-wa"
                checked={p.whatsapp_opt_in}
                disabled={!p.whatsapp_verified_at}
                label={t("whatsapp.optIn")}
                hint={t("whatsapp.stopHint")}
                onChange={(e) => optIn.mutate({ optIn: e.target.checked, lang: language })}
              />
              <Checkbox
                id="set-calls"
                checked={p.call_consent}
                label={t("calls.consent")}
                hint={t("calls.hint")}
                onChange={(e) => update.mutate({ call_consent: e.target.checked })}
              />
            </Card>
            <Card className="space-y-3">
              <h2 className="text-xl font-bold">{t("account.title")}</h2>
              <Button variant="outline" onClick={() => void linkGoogle()}>
                {t("account.linkGoogle")}
              </Button>
              <Button variant="outline" onClick={exportData}>
                {t("account.export")}
              </Button>
              <Button variant="outline" onClick={() => void signOut().then(() => navigate("/"))}>
                {t("account.signOut")}
              </Button>
              {!isConfirming ? (
                <Button variant="quiet" onClick={() => setIsConfirming(true)}>
                  {t("account.delete")}
                </Button>
              ) : (
                <div
                  role="alertdialog"
                  aria-labelledby="del-title"
                  className="space-y-2 rounded-xl bg-ink/5 p-4"
                >
                  <p id="del-title" className="font-bold">
                    {t("account.deleteConfirm")}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="solid" onClick={() => void remove()}>
                      {t("account.deleteYes")}
                    </Button>
                    <Button variant="quiet" onClick={() => setIsConfirming(false)}>
                      {t("account.deleteNo")}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </QueryView>
  );
}
