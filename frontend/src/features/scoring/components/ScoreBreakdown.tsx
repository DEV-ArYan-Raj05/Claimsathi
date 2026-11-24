/** Readiness score ring + every lost point explained (PRD §3.4). Not a prediction of approval. */
import { useTranslation } from "react-i18next";
import type { ReadinessScore } from "@/shared/api/contract";
import { ScoreRing } from "@/shared/components/ScoreRing";
import { useLang } from "@/shared/hooks/useLang";

export function ScoreBreakdown({ score }: { score: ReadinessScore }) {
  const { t } = useTranslation("scoring");
  const { pick } = useLang();
  return (
    <section aria-labelledby="score-title" className="space-y-4">
      <h2 id="score-title" className="text-xl font-bold">
        {t("title")}
      </h2>
      <ScoreRing score={score.score} />
      <ul className="space-y-3">
        {score.breakdown.map((b) => (
          <li key={b.component}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{t(`component.${b.component}`)}</span>
              <span className="tabular-nums">{t("points", { got: b.got, max: b.max })}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full origin-left bg-ink/70"
                style={{ transform: `scaleX(${b.max ? b.got / b.max : 0})` }}
              />
            </div>
            {b.reasons.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-sm text-caption">
                {b.reasons.map((r, i) => (
                  <li key={i}>{pick(r)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-caption">{t("disclaimer")}</p>
    </section>
  );
}
