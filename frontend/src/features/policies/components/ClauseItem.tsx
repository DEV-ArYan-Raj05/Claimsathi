import { useTranslation } from "react-i18next";
import type { Clause } from "@/shared/api/contract";
import { useLang } from "@/shared/hooks/useLang";
import { cn } from "@/shared/lib/cn";

/** One clause in plain language, with the source page and exact quote (PRD §3.1). */
export function ClauseItem({ clause, showRisk = false }: { clause: Clause; showRisk?: boolean }) {
  const { t } = useTranslation("policies");
  const { pick } = useLang();
  return (
    <li className="rounded-xl border-2 border-ink/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{pick(clause.title)}</h3>
        <span className="text-sm text-caption">{t("detail.page", { page: clause.page })}</span>
      </div>
      <p className="mt-1 text-base">{pick(clause.plain)}</p>
      <details className="mt-2">
        <summary className="min-h-tap cursor-pointer py-2 text-sm font-medium">
          {t("detail.showQuote")}
        </summary>
        <blockquote className="border-l-4 border-ink/20 pl-3 text-sm italic text-caption">
          “{clause.quote}”
        </blockquote>
      </details>
      {showRisk && (
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium",
            clause.risk === "high" ? "bg-ink text-secondary" : "bg-ink/10",
          )}
        >
          {t(`risk.${clause.risk}`)}
        </span>
      )}
    </li>
  );
}
