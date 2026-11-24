/** x-08 My claims: this track's claims with stage, amount and expected date. */
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { EmptyState } from "@/shared/components/StateViews";
import { useTrack } from "@/shared/hooks/useTrack";
import { ClaimCard } from "../components/ClaimCard";
import { useClaims } from "../hooks/useClaims";

export function X08MyClaimsPage() {
  const { t } = useTranslation("claims");
  const track = useTrack();
  const claims = useClaims(track);
  const start = (
    <Link
      to={`/${track}/claims/new`}
      className="inline-flex min-h-tap items-center gap-2 rounded-xl bg-ink px-5 font-medium text-secondary"
    >
      <Plus aria-hidden className="h-4 w-4" />
      {t(`new.title.${track}`)}
    </Link>
  );
  return (
    <>
      <PageHeader title={t("list.title")} action={start} />
      <QueryView
        query={claims}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title={t("list.emptyTitle")}
            body={t(`list.emptyBody.${track}`)}
            action={start}
          />
        }
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </ul>
        )}
      </QueryView>
    </>
  );
}
