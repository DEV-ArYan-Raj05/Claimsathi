/** Long-job progress steps (PRD §4.3): user can leave; the job keeps running server-side. */
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Job } from "../api/contract";
import { cn } from "../lib/cn";

export function JobProgress({ job, steps }: { job: Job | undefined; steps: readonly string[] }) {
  const { t } = useTranslation();
  const at = job ? steps.indexOf(job.step) : 0;
  const isDone = job?.status === "done";
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const state = isDone || i < at ? "done" : i === at ? "active" : "todo";
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full",
                  state === "done" ? "bg-ink text-secondary" : "bg-ink/10 text-ink",
                )}
              >
                {state === "done" ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : state === "active" ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  i + 1
                )}
              </span>
              <span className={cn("text-base", state === "todo" && "text-caption")}>
                {t(`job.step.${step}`)}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full origin-left bg-ink transition-transform duration-500"
          style={{ transform: `scaleX(${(job?.progress ?? 0) / 100})` }}
        />
      </div>
      {!isDone && <p className="text-sm text-caption">{t("job.canLeave")}</p>}
    </div>
  );
}
