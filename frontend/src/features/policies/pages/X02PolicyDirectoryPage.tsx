/** x-02 Policy Directory: this track's policies only, filter by status, "+ Add policy". */
import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PolicyStatus } from "@/shared/api/contract";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { EmptyState } from "@/shared/components/StateViews";
import { useTrack } from "@/shared/hooks/useTrack";
import { cn } from "@/shared/lib/cn";
import { PolicyCard } from "../components/PolicyCard";
import { usePolicies } from "../hooks/usePolicies";

const FILTERS = ["all", "active", "expiring_soon", "expired"] as const;

export function X02PolicyDirectoryPage() {
  const { t } = useTranslation("policies");
  const track = useTrack();
  const policies = usePolicies(track);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const add = (
    <Link
      to={`/${track}/policies/new`}
      className="inline-flex min-h-tap items-center gap-2 rounded-xl bg-ink px-5 font-medium text-secondary"
    >
      <Plus aria-hidden className="h-4 w-4" />
      {t("directory.add")}
    </Link>
  );

  return (
    <>
      <PageHeader
        title={t("directory.title")}
        subtitle={t(`directory.subtitle.${track}`)}
        action={add}
      />
      <div
        role="radiogroup"
        aria-label={t("directory.filter")}
        className="mb-4 flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            role="radio"
            aria-checked={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "min-h-tap rounded-full px-4 text-sm font-medium",
              filter === f ? "bg-secondary text-ink" : "bg-on-dominant/10 text-on-dominant",
            )}
          >
            {t(f === "all" ? "directory.all" : `status.${f}`)}
          </button>
        ))}
      </div>
      <QueryView
        query={policies}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title={t("directory.emptyTitle")}
            body={t(`directory.emptyBody.${track}`)}
            action={add}
          />
        }
      >
        {(list) => {
          const shown = list.filter(
            (p) => filter === "all" || p.status === (filter as PolicyStatus),
          );
          return shown.length ? (
            <ul className="space-y-3">
              {shown.map((p) => (
                <PolicyCard key={p.id} policy={p} />
              ))}
            </ul>
          ) : (
            <p className="text-on-dominant">{t("directory.noMatch")}</p>
          );
        }}
      </QueryView>
    </>
  );
}
