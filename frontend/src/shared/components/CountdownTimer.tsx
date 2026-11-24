/** Deadline countdown (crop 72 h, health intimation window) — an allowed accent use. */
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { timeLeft } from "../lib/format";
import { cn } from "../lib/cn";

export function CountdownTimer({
  dueAt,
  labelKey,
  className,
}: {
  dueAt: string;
  labelKey: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const left = timeLeft(dueAt, now);
  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-on-accent",
        className,
      )}
    >
      <Timer aria-hidden className="h-5 w-5 shrink-0" />
      <span className="text-base font-medium">
        {left.isOverdue
          ? t("countdown.overdue", { hours: left.hours, minutes: left.minutes })
          : t(labelKey, { hours: left.hours, minutes: left.minutes })}
      </span>
    </div>
  );
}
