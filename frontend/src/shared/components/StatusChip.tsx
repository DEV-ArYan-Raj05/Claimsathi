import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

/** Stages where accent is allowed: "Query raised" / "Rejected" / overdue (PRD §2 accent rules). */
const ACCENT_STAGES = new Set(["query_raised", "rejected"]);
const SUCCESS_STAGES = new Set(["payment_credited", "approved"]);

export function StatusChip({ stage, isOverdue = false }: { stage: string; isOverdue?: boolean }) {
  const { t } = useTranslation();
  const tone =
    isOverdue || ACCENT_STAGES.has(stage)
      ? "bg-accent text-on-accent"
      : SUCCESS_STAGES.has(stage)
        ? "bg-success text-on-accent"
        : "bg-ink/10 text-ink";
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", tone)}
    >
      {isOverdue ? t("stage.overdue") : stage ? t(`stage.${stage}`) : t("stage.not_started")}
    </span>
  );
}
