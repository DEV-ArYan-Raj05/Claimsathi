import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Claim } from "@/shared/api/contract";
import { StatusChip } from "@/shared/components/StatusChip";
import { useLang } from "@/shared/hooks/useLang";
import { formatDate, formatMoney, toPaise } from "@/shared/lib/format";

/** x-08 row: stage chip, amount, expected date. Drafts open the document screen, others the tracker. */
export function ClaimCard({ claim }: { claim: Claim }) {
  const { t } = useTranslation("claims");
  const { lang } = useLang();
  const to =
    claim.status === "draft"
      ? `/${claim.track}/claims/${claim.id}/documents`
      : `/${claim.track}/claims/${claim.id}`;
  const subject = String(claim.incident.patient ?? claim.incident.crop ?? "");
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-4 rounded-2xl bg-secondary p-5 text-ink hover:bg-secondary/90"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip stage={claim.current_stage} isOverdue={claim.is_overdue} />
            {claim.status === "draft" && (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-sm">{t("list.draft")}</span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold">{subject}</h2>
          <p className="text-caption">
            {t("list.event", { date: formatDate(claim.event_at, lang) })}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <dt className="inline text-caption">{t("list.amount")} </dt>
              <dd className="inline font-bold">
                {formatMoney(toPaise(claim.amount_approved ?? claim.amount_claimed), lang)}
              </dd>
            </div>
            {claim.expected_settlement_date && (
              <div>
                <dt className="inline text-caption">{t("list.expected")} </dt>
                <dd className="inline">{formatDate(claim.expected_settlement_date, lang)}</dd>
              </div>
            )}
            <div>
              <dt className="inline text-caption">{t("list.readiness")} </dt>
              <dd className="inline tabular-nums">{claim.readiness_score}</dd>
            </div>
          </dl>
        </div>
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-ink/50" />
      </Link>
    </li>
  );
}
