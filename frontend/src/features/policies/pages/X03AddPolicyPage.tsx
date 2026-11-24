/** x-03 Add policy: upload → Reading → Extracting → Review editable fields → "Save policy". */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { JobProgress } from "@/shared/components/JobProgress";
import { PageHeader } from "@/shared/components/PageHeader";
import { UploadSlot } from "@/shared/components/UploadSlot";
import { useJob } from "@/shared/hooks/useJob";
import { useTrack } from "@/shared/hooks/useTrack";
import { Card } from "@/shared/ui/card";
import { ReviewPolicyForm } from "../components/ReviewPolicyForm";
import { useCreatePolicy, usePolicy } from "../hooks/usePolicies";

const STEPS = ["reading", "extracting", "review"] as const;

export function X03AddPolicyPage() {
  const { t } = useTranslation("policies");
  const track = useTrack();
  const navigate = useNavigate();
  const create = useCreatePolicy(track);
  const [ids, setIds] = useState<{ policy_id: string; job_id: string } | null>(null);
  const job = useJob(ids?.job_id);
  const isExtracted = job.data?.status === "done";
  const policy = usePolicy(isExtracted ? ids?.policy_id : undefined);

  return (
    <>
      <PageHeader
        title={t("add.title")}
        subtitle={t(`add.subtitle.${track}`)}
        backTo={`/${track}/policies`}
      />
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">{t("add.uploadTitle")}</h2>
          <p className="text-caption">{t("add.uploadHint")}</p>
          {!ids && (
            <UploadSlot
              label={t("add.uploadTitle")}
              isBusy={create.isPending}
              onUpload={async (file, name) => setIds(await create.mutateAsync({ file, name }))}
            />
          )}
          {create.isError && <p role="alert">{t("add.failed")}</p>}
          {ids && <JobProgress job={job.data} steps={STEPS} />}
        </Card>
        <Card>
          {policy.data ? (
            <ReviewPolicyForm
              policy={policy.data}
              onSaved={() => navigate(`/${track}/policies/${policy.data.id}`)}
            />
          ) : (
            <p className="text-caption">{t("add.reviewWaiting")}</p>
          )}
        </Card>
      </div>
    </>
  );
}
