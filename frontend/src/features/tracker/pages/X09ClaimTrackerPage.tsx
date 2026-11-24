/** x-09 Claim tracker: timeline, expected settlement, update status, escalation, WhatsApp log. */
import { MessageCircleWarning } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/features/auth";
import { useClaim } from "@/features/claims";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { StatusChip } from "@/shared/components/StatusChip";
import { useTrack } from "@/shared/hooks/useTrack";
import { Card } from "@/shared/ui/card";
import { ClaimTimeline } from "../components/ClaimTimeline";
import { EscalationCard, ExpectedSettlementCard, WhatsAppLog } from "../components/TrackerCards";
import { UpdateStatus } from "../components/UpdateStatus";

export function X09ClaimTrackerPage() {
  const { t } = useTranslation("tracker");
  const { id } = useParams();
  const track = useTrack();
  const claim = useClaim(id);
  const profile = useProfile();

  return (
    <QueryView query={claim}>
      {(d) => (
        <>
          <PageHeader
            title={t("title", { ref: d.claim.claim_ref ?? t("noRef") })}
            subtitle={d.claim.insurer}
            backTo={`/${track}/claims`}
            action={<StatusChip stage={d.claim.current_stage} isOverdue={d.overdue_days > 0} />}
          />
          {profile.data && !profile.data.whatsapp_verified_at && (
            <Card className="mb-4 flex items-start gap-3">
              <MessageCircleWarning aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                {t("verifyBanner")}{" "}
                <Link to="/settings" className="font-medium underline underline-offset-4">
                  {t("verifyLink")}
                </Link>
              </p>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Card>
              <ClaimTimeline stages={d.stages} overdueDays={d.overdue_days} />
            </Card>
            <div className="space-y-4">
              <ExpectedSettlementCard detail={d} />
              <EscalationCard claimId={d.claim.id} overdueDays={d.overdue_days} />
              <Card>
                <UpdateStatus claimId={d.claim.id} stages={d.stages} />
              </Card>
              <WhatsAppLog claimId={d.claim.id} />
            </div>
          </div>
        </>
      )}
    </QueryView>
  );
}
