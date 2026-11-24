/**
 * Vertical stage timeline (PRD §4.4): stages draw in as they scroll into view and the line
 * fills to the current stage. Transform/opacity only; instant under reduced motion.
 */
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Stage } from "@/shared/api/contract";
import { useLang } from "@/shared/hooks/useLang";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

export function ClaimTimeline({ stages, overdueDays }: { stages: Stage[]; overdueDays: number }) {
  const { t } = useTranslation("tracker");
  const { lang } = useLang();
  const listRef = useRef<HTMLOListElement>(null);
  const doneCount = stages.filter((s) => s.entered_at).length;
  const fill = stages.length > 1 ? Math.max(0, doneCount - 1) / (stages.length - 1) : 0;

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-stage]");
    if (!items) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.setAttribute("data-shown", "")),
      { rootMargin: "0px 0px -10% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [stages.length]);

  return (
    <ol ref={listRef} className="relative space-y-6 pl-12">
      <span aria-hidden className="absolute bottom-4 left-[19px] top-4 w-1 rounded bg-ink/10" />
      <span
        aria-hidden
        className="absolute left-[19px] top-4 w-1 origin-top rounded bg-ink transition-transform duration-1000 ease-out motion-reduce:transition-none"
        style={{ height: "calc(100% - 2rem)", transform: `scaleY(${fill})` }}
      />
      {stages.map((s, i) => {
        const isDone = Boolean(s.entered_at);
        const isNext = i === doneCount;
        const isLate =
          !isDone &&
          overdueDays > 0 &&
          Boolean(s.due_at) &&
          new Date(s.due_at ?? "").getTime() < Date.now();
        const isQuery = s.stage_code === "query_raised" && isDone;
        return (
          <li
            key={s.id}
            data-stage
            className="relative translate-y-3 opacity-0 transition duration-500 ease-out data-[shown]:translate-y-0 data-[shown]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className={cn(
                "absolute -left-12 top-0 grid h-10 w-10 place-items-center rounded-full border-4 border-secondary",
                isLate || isQuery
                  ? "bg-accent text-on-accent"
                  : isDone
                    ? "bg-ink text-secondary"
                    : "bg-ink/10 text-ink",
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-bold">{i + 1}</span>
              )}
            </span>
            <div className={cn("rounded-xl p-3", isNext && "bg-ink/5")}>
              <p className={cn("text-lg font-bold", !isDone && !isNext && "text-caption")}>
                {t(`stage.${s.stage_code}`, { ns: "common" })}
              </p>
              {isDone && s.entered_at && (
                <p className="text-sm text-caption">
                  {t("byOn", {
                    actor: t(`actor.${s.actor}`),
                    date: formatDateTime(s.entered_at, lang),
                  })}
                </p>
              )}
              {s.response_text && <p className="mt-1 text-base">“{s.response_text}”</p>}
              {!isDone && s.due_at && (
                <p
                  className={cn(
                    "mt-1 inline-block text-sm",
                    isLate
                      ? "rounded-full bg-accent px-3 py-1 font-medium text-on-accent"
                      : "text-caption",
                  )}
                >
                  {isLate
                    ? t("overdueBy", { count: overdueDays })
                    : t("dueBy", { date: formatDate(s.due_at, lang) })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
