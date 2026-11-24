/** x-04 Policy detail: summary, coverage card, "What can reject my claim", clauses, Ask, original. */
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { Clause } from "@/shared/api/contract";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { useLang } from "@/shared/hooks/useLang";
import { useTrack } from "@/shared/hooks/useTrack";
import { formatDate, formatMoney, maskTail, toPaise } from "@/shared/lib/format";
import { Card } from "@/shared/ui/card";
import { AskPolicy } from "../components/AskPolicy";
import { ClauseItem } from "../components/ClauseItem";
import { PolicyStatusChip } from "../components/PolicyCard";
import { usePolicy } from "../hooks/usePolicies";

const RISK_ORDER: Record<Clause["risk"], number> = { high: 0, med: 1, low: 2 };
const GROUPS = ["coverage", "limit", "waiting_period", "exclusion", "procedure"] as const;

export function X04PolicyDetailPage() {
  const { t } = useTranslation("policies");
  const { id } = useParams();
  const track = useTrack();
  const { lang, pick } = useLang();
  const policy = usePolicy(id, true);

  return (
    <QueryView query={policy}>
      {(p) => {
        const rejectRisks = p.clauses
          .filter((c) => c.type === "fine_print" || c.risk === "high")
          .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
        return (
          <>
            <PageHeader
              title={p.product}
              subtitle={t("detail.subtitle", { insurer: p.insurer, no: maskTail(p.policy_no) })}
              backTo={`/${track}/policies`}
            />
            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center gap-2">
                    <PolicyStatusChip status={p.status} />
                  </div>
                  <p className="mt-3 text-lg">{pick(p.summary)}</p>
                </Card>
                <Card>
                  <h2 className="text-xl font-bold">{t("detail.rejectTitle")}</h2>
                  <p className="text-caption">{t("detail.rejectBody")}</p>
                  <ul className="mt-3 space-y-3">
                    {rejectRisks.map((c) => (
                      <ClauseItem key={c.id} clause={c} showRisk />
                    ))}
                  </ul>
                </Card>
                <Card className="space-y-6">
                  {GROUPS.map((g) => {
                    const list = p.clauses.filter((c) => c.type === g);
                    if (!list.length) return null;
                    return (
                      <section key={g}>
                        <h2 className="text-xl font-bold">{t(`clauseType.${g}`)}</h2>
                        <ul className="mt-3 space-y-3">
                          {list.map((c) => (
                            <ClauseItem key={c.id} clause={c} />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <h2 className="text-xl font-bold">{t("detail.coverageTitle")}</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-y-3 text-base">
                    <dt className="text-caption">{t("field.sum_insured")}</dt>
                    <dd className="text-right text-2xl font-extrabold">
                      {formatMoney(toPaise(p.sum_insured), lang)}
                    </dd>
                    <dt className="text-caption">{t("detail.period")}</dt>
                    <dd className="text-right">
                      {formatDate(p.start_date, lang)} – {formatDate(p.end_date, lang)}
                    </dd>
                    <dt className="text-caption">{t("detail.insured")}</dt>
                    <dd className="text-right">{p.insured.join(", ")}</dd>
                    <dt className="text-caption">{t("detail.window")}</dt>
                    <dd className="text-right">
                      {t("detail.hours", { count: p.intimation_window_hours })}
                    </dd>
                    {p.tpa && (
                      <>
                        <dt className="text-caption">{t("detail.tpa")}</dt>
                        <dd className="text-right">{p.tpa}</dd>
                      </>
                    )}
                  </dl>
                </Card>
                <Card>
                  <AskPolicy policyId={p.id} track={track} />
                </Card>
                <Card>
                  <h2 className="text-lg font-bold">{t("detail.original")}</h2>
                  <p className="text-caption">{t("detail.originalBody")}</p>
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </QueryView>
  );
}
