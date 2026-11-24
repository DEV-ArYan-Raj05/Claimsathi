/** x-07 Claim pack preview: letter, form fields, bills, enclosures; download/share/send. */
import { useState } from "react";
import { AlertTriangle, Copy, Printer, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useClaim } from "@/features/claims";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { useLang } from "@/shared/hooks/useLang";
import { useTrack } from "@/shared/hooks/useTrack";
import { maskTail } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { BillTable, Enclosures, FormFieldsCard, LetterPreview } from "../components/PackSections";
import { usePack, useSubmitClaim } from "../hooks/usePack";

export function X07ClaimPackPage() {
  const { t } = useTranslation("claimPack");
  const { id = "" } = useParams();
  const track = useTrack();
  const { lang, pick } = useLang();
  const navigate = useNavigate();
  const pack = usePack(id);
  const claim = useClaim(id);
  const submit = useSubmitClaim(id);
  const [copied, setCopied] = useState(false);
  const warnings = claim.data?.claim.coverage_warnings ?? [];

  const send = async (email: string, letter: string) => {
    // We never file into insurer systems: open the user's mail app with the letter, then record it.
    const subject = t("send.subject", { no: maskTail(claim.data?.claim.policy_no ?? "") });
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`,
      "_blank",
      "noopener",
    );
    await submit.mutateAsync("email");
    navigate(`/${track}/claims/${id}`);
  };

  return (
    <QueryView query={pack}>
      {(p) => (
        <>
          <div className="print:hidden">
            <PageHeader
              title={t("title")}
              subtitle={t("subtitle")}
              backTo={`/${track}/claims/${id}/documents`}
            />
          </div>
          {warnings.length > 0 && (
            <Card className="mb-4 border-l-[6px] border-accent print:hidden">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle aria-hidden className="h-5 w-5" />
                {t("warning")}
              </p>
              <ul className="mt-2 list-disc pl-6">
                {warnings.map((w) => (
                  <li key={w.id}>
                    {pick(w.title)}: {pick(w.plain)}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4">
              <LetterPreview pack={p} />
              <BillTable pack={p} />
            </div>
            <div className="space-y-4 print:hidden">
              <Card className="space-y-3">
                <h2 className="text-xl font-bold">{t("send.title")}</h2>
                {p.blocking_alerts > 0 ? (
                  <p role="alert" className="rounded-xl bg-accent p-3 text-on-accent">
                    {t("send.blocked", { count: p.blocking_alerts })}{" "}
                    <Link
                      to={`/${track}/claims/${id}/documents`}
                      className="font-bold underline underline-offset-4"
                    >
                      {t("send.fix")}
                    </Link>
                  </p>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    isBusy={submit.isPending}
                    onClick={() => void send(p.insurer_email, p.letter[lang])}
                  >
                    {t("send.cta")}
                  </Button>
                )}
                <p className="text-sm text-caption">
                  {t("send.howItWorks", { email: p.insurer_email })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer aria-hidden className="h-4 w-4" />
                    {t("actions.print")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(p.insurer_email)
                        .then(() => setCopied(true))
                    }
                  >
                    <Copy aria-hidden className="h-4 w-4" />
                    {copied ? t("actions.copied") : t("actions.copyEmail")}
                  </Button>
                  <a
                    className="col-span-2 inline-flex min-h-tap items-center justify-center gap-2 rounded-xl border-2 border-ink/25 font-medium"
                    href={`https://wa.me/?text=${encodeURIComponent(t("actions.shareText", { no: maskTail(claim.data?.claim.policy_no ?? "") }))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Share2 aria-hidden className="h-4 w-4" />
                    {t("actions.whatsapp")}
                  </a>
                </div>
              </Card>
              <FormFieldsCard pack={p} />
              <Enclosures pack={p} />
            </div>
          </div>
        </>
      )}
    </QueryView>
  );
}
