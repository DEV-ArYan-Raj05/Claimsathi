/** x-06 Documents and alerts: alert list, checklist with uploads, readiness score ring. */
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useClaim } from "@/features/claims";
import { ScoreBreakdown } from "@/features/scoring";
import { CountdownTimer } from "@/shared/components/CountdownTimer";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { useTrack } from "@/shared/hooks/useTrack";
import { Card } from "@/shared/ui/card";
import { AlertList } from "../components/AlertList";
import { ChecklistSection } from "../components/ChecklistSection";

export function X06DocumentsPage() {
  const { t } = useTranslation("documents");
  const { id } = useParams();
  const track = useTrack();
  const claim = useClaim(id);

  return (
    <QueryView query={claim}>
      {(d) => (
        <>
          <PageHeader
            title={t("title")}
            subtitle={t(`subtitle.${track}`, {
              subject: String(d.claim.incident.patient ?? d.claim.incident.crop ?? ""),
            })}
            backTo={`/${track}/claims`}
          />
          {!d.claim.intimated_at && (
            <div className="mb-4">
              <CountdownTimer
                dueAt={d.claim.intimation_due_at}
                labelKey={`documents:countdown.${track}`}
              />
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4">
              <AlertList detail={d} />
              <ChecklistSection detail={d} />
            </div>
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <Card>
                <ScoreBreakdown score={d.score} />
              </Card>
              <Card className="space-y-3">
                <p className="text-base">{t("next.body")}</p>
                <Link
                  to={`/${track}/claims/${d.claim.id}/pack`}
                  className="inline-flex min-h-tap w-full items-center justify-center rounded-xl bg-ink px-5 font-medium text-secondary"
                >
                  {t("next.cta")}
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </QueryView>
  );
}
