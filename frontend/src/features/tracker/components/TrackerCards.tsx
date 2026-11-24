/** Expected settlement card, escalation and WhatsApp log for x-09. */
import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ClaimDetail } from "@/shared/api/contract";
import { useLang } from "@/shared/hooks/useLang";
import { formatDate, formatDateTime, formatMoney, toPaise } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useEscalation, useWhatsAppLog } from "../hooks/useTracker";

export function ExpectedSettlementCard({ detail }: { detail: ClaimDetail }) {
  const { t } = useTranslation("tracker");
  const { lang, pick } = useLang();
  const amount = detail.expected_amount;
  const date = detail.claim.expected_settlement_date;
  return (
    <Card>
      <h2 className="text-lg font-bold">{t("settlement.title")}</h2>
      {amount && (
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-accent">
          {formatMoney(toPaise(amount), lang)}
        </p>
      )}
      <p className="mt-1 text-sm text-caption">
        {detail.claim.amount_approved ? t("settlement.approved") : t("settlement.claimed")}
      </p>
      <p className="mt-4 text-base">
        {date ? t("settlement.dueBy", { date: formatDate(date, lang) }) : t("settlement.noDate")}
      </p>
      <p className="mt-1 text-sm text-caption">{t("settlement.basis")}</p>
      {detail.interest_note && (
        <p className="mt-3 rounded-xl bg-ink/5 p-3 text-base">{pick(detail.interest_note)}</p>
      )}
    </Card>
  );
}

export function EscalationCard({ claimId, overdueDays }: { claimId: string; overdueDays: number }) {
  const { t } = useTranslation("tracker");
  const { pick } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const esc = useEscalation(claimId, isOpen);
  if (overdueDays <= 0) return null;
  return (
    <Card className="border-l-[6px] border-accent">
      <h2 className="text-lg font-bold">{t("escalation.title", { count: overdueDays })}</h2>
      <p className="mt-1">{t("escalation.body")}</p>
      {!isOpen ? (
        <Button variant="solid" className="mt-3" onClick={() => setIsOpen(true)}>
          {t("escalation.open")}
        </Button>
      ) : esc.data ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-caption">
            {t("escalation.where")}: {esc.data.channels.map((c) => t(`channel.${c}`)).join(", ")}
          </p>
          <div className="whitespace-pre-wrap rounded-xl bg-ink/5 p-4 text-base">
            {pick(esc.data.letter)}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              void navigator.clipboard.writeText(pick(esc.data?.letter)).then(() => setCopied(true))
            }
          >
            <Copy aria-hidden className="h-4 w-4" />
            {copied ? t("escalation.copied") : t("escalation.copy")}
          </Button>
        </div>
      ) : (
        <p role="status" className="mt-3 text-caption">
          {t("escalation.loading")}
        </p>
      )}
    </Card>
  );
}

export function WhatsAppLog({ claimId }: { claimId: string }) {
  const { t } = useTranslation("tracker");
  const { lang, pick } = useLang();
  const log = useWhatsAppLog(claimId);
  if (!log.data?.length) return null;
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <MessageCircle aria-hidden className="h-5 w-5" />
        {t("whatsapp.title")}
      </h2>
      <ul className="mt-3 space-y-2">
        {log.data.map((m) => (
          <li key={m.id} className="rounded-xl bg-ink/5 p-3">
            <p className="text-base">{pick(m.body)}</p>
            <p className="text-sm text-caption">
              {formatDateTime(m.created_at, lang)}, {t(`whatsapp.status.${m.status}`)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
