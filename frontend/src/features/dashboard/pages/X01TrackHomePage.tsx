/**
 * x-01 Track home. Opens with the scroll story; the greeting and next deadline ride on top of
 * it so the most urgent fact is visible from the first frame. Dashboard cards follow.
 */
import { ArrowDown, MessageCircleWarning } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useProfile } from "@/features/auth";
import { CountdownTimer } from "@/shared/components/CountdownTimer";
import { QueryView } from "@/shared/components/QueryView";
import { ScoreRing } from "@/shared/components/ScoreRing";
import { Skeleton } from "@/shared/components/Skeleton";
import { useTrack } from "@/shared/hooks/useTrack";
import { formatDate } from "@/shared/lib/format";
import { useLang } from "@/shared/hooks/useLang";
import { Card } from "@/shared/ui/card";
import { TrackStory } from "../components/TrackStory";
import { useDashboard } from "../hooks/useDashboard";

export function X01TrackHomePage() {
  const { t } = useTranslation("dashboard");
  const track = useTrack();
  const { lang } = useLang();
  const dashboard = useDashboard(track);
  const profile = useProfile();
  const data = dashboard.data;
  const deadline = data?.next_deadline;

  return (
    <div className="-mx-4 lg:mx-0">
      <TrackStory track={track}>
        <div className="absolute inset-x-0 top-0 flex flex-col items-start gap-3 p-5 sm:p-8">
          <p className="rounded-xl bg-secondary/95 px-4 py-2 text-xl font-bold text-ink">
            {data ? (
              t("greeting", { name: data.name || t("friend") })
            ) : (
              <Skeleton className="h-6 w-40" />
            )}
          </p>
          {deadline?.kind === "intimation" && (
            <Link to={`/${track}/claims/${deadline.claim_id}/documents`} className="rounded-xl">
              <CountdownTimer dueAt={deadline.due_at} labelKey={`dashboard:countdown.${track}`} />
            </Link>
          )}
          <a
            href="#dashboard"
            className="inline-flex min-h-tap items-center gap-1 rounded-xl bg-secondary/95 px-3 text-sm font-medium text-ink"
          >
            <ArrowDown aria-hidden className="h-4 w-4" />
            {t("skipStory")}
          </a>
        </div>
      </TrackStory>

      <section id="dashboard" className="scroll-mt-20 space-y-4 px-4 pb-10 pt-8 lg:px-0">
        <h1 className="text-3xl font-extrabold text-on-dominant">{t(`title.${track}`)}</h1>

        {profile.data && !profile.data.whatsapp_verified_at && (
          <Card className="flex items-start gap-3">
            <MessageCircleWarning aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1">
              {t("verifyBanner")}{" "}
              <Link to="/settings" className="font-medium underline underline-offset-4">
                {t("verifyLink")}
              </Link>
            </p>
          </Card>
        )}

        <QueryView query={dashboard}>
          {(d) => (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <Card className="flex flex-col justify-between gap-4">
                <p className="text-caption">{t("activePolicies")}</p>
                <p className="text-5xl font-extrabold tabular-nums">{d.active_policies}</p>
                <Link
                  to={`/${track}/policies`}
                  className="font-medium underline underline-offset-4"
                >
                  {t("seePolicies")}
                </Link>
              </Card>
              <Card className="flex flex-col justify-between gap-4">
                <p className="text-caption">{t("openClaims")}</p>
                <p className="text-5xl font-extrabold tabular-nums">{d.open_claims}</p>
                {deadline?.kind === "settlement" ? (
                  <p className="text-base">
                    {t("nextSettlement", { date: formatDate(deadline.due_at, lang) })}
                  </p>
                ) : (
                  <Link
                    to={`/${track}/claims`}
                    className="font-medium underline underline-offset-4"
                  >
                    {t("seeClaims")}
                  </Link>
                )}
              </Card>
              <Card className="flex flex-col items-center gap-2 md:min-w-56">
                <p className="text-caption">{t("averageScore")}</p>
                {d.average_score === null ? (
                  <p className="py-8 text-caption">{t("noScore")}</p>
                ) : (
                  <ScoreRing score={d.average_score} size={112} />
                )}
              </Card>
            </div>
          )}
        </QueryView>

        <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">{t(`start.${track}.title`)}</h2>
            <p className="text-caption">{t(`start.${track}.body`)}</p>
          </div>
          <Link
            to={`/${track}/claims/new`}
            className="inline-flex min-h-tap items-center rounded-xl bg-accent px-6 text-base font-medium text-on-accent hover:bg-accent/90"
          >
            {t(`start.${track}.cta`)}
          </Link>
        </Card>
      </section>
    </div>
  );
}
