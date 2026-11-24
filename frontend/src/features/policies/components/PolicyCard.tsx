import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PolicySummary } from "@/shared/api/contract";
import { formatDate, formatMoney, maskTail, toPaise } from "@/shared/lib/format";
import { useLang } from "@/shared/hooks/useLang";
import { cn } from "@/shared/lib/cn";

const STATUS_TONE: Record<PolicySummary["status"], string> = {
  active: "bg-success text-on-accent",
  expiring_soon: "bg-ink text-secondary",
  expired: "bg-ink/10 text-ink",
  processing: "bg-ink/10 text-ink",
};

export function PolicyStatusChip({ status }: { status: PolicySummary["status"] }) {
  const { t } = useTranslation("policies");
  return (
    <span className={cn("rounded-full px-3 py-1 text-sm font-medium", STATUS_TONE[status])}>
      {t(`status.${status}`)}
    </span>
  );
}

export function PolicyCard({ policy }: { policy: PolicySummary }) {
  const { t } = useTranslation("policies");
  const { lang } = useLang();
  return (
    <li>
      <Link
        to={`/${policy.track}/policies/${policy.id}`}
        className="flex items-center gap-4 rounded-2xl bg-secondary p-5 text-ink hover:bg-secondary/90"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PolicyStatusChip status={policy.status} />
            <span className="text-sm text-caption">{maskTail(policy.policy_no)}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold">{policy.product}</h2>
          <p className="text-caption">{policy.insurer}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base">
            <div>
              <dt className="inline text-caption">{t("card.sumInsured")} </dt>
              <dd className="inline font-bold">{formatMoney(toPaise(policy.sum_insured), lang)}</dd>
            </div>
            <div>
              <dt className="inline text-caption">{t("card.expires")} </dt>
              <dd className="inline">{formatDate(policy.end_date, lang)}</dd>
            </div>
          </dl>
        </div>
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-ink/50" />
      </Link>
    </li>
  );
}
