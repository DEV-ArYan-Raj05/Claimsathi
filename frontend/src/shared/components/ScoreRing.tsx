/**
 * Claim Readiness Score ring (PRD §3.4). Band colours: ready → success, fix → dominant,
 * high_risk → accent (one of the six accent uses). It is readiness, never odds of approval.
 */
import { useTranslation } from "react-i18next";
import type { ScoreBand } from "../api/contract";
import { cn } from "../lib/cn";
import { bandFor } from "../lib/score";

const RING: Record<ScoreBand, string> = {
  ready: "text-success",
  fix: "text-dominant",
  high_risk: "text-accent",
};
const CHIP: Record<ScoreBand, string> = {
  ready: "bg-success text-on-accent",
  fix: "bg-dominant text-on-dominant",
  high_risk: "bg-accent text-on-accent",
};

export function ScoreRing({
  score,
  size = 132,
  showLabel = true,
}: {
  score: number;
  size?: number;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const band = bandFor(score);
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-ink/10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className={cn("stroke-current transition-[stroke-dashoffset] duration-700", RING[band])}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-ink">
          <span
            className="text-4xl font-extrabold tabular-nums"
            aria-label={t("score.aria", { score })}
          >
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("rounded-full px-3 py-1 text-sm font-medium", CHIP[band])}>
          {t(`score.band.${band}`)}
        </span>
      )}
    </div>
  );
}
