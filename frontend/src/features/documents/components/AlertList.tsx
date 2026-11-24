/** Alert list at the top of x-06 (PRD §3.3): what's wrong, on which document, and the fix. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ClaimDetail } from "@/shared/api/contract";
import { AlertItem } from "@/shared/components/AlertItem";
import { UploadSlot } from "@/shared/components/UploadSlot";
import { useLang } from "@/shared/hooks/useLang";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { useAttachDocument, useOverrideCheck } from "../hooks/useDocuments";
import { buildAlerts } from "../utils";

function OverrideForm({
  onSave,
  onCancel,
  isBusy,
}: {
  onSave: (reason: string) => void;
  onCancel: () => void;
  isBusy: boolean;
}) {
  const { t } = useTranslation("documents");
  const [reason, setReason] = useState("");
  return (
    <form
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim()) onSave(reason.trim());
      }}
    >
      <label className="sr-only" htmlFor="override-reason">
        {t("override.label")}
      </label>
      <Input
        id="override-reason"
        autoFocus
        value={reason}
        maxLength={300}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("override.placeholder")}
      />
      <Button type="submit" variant="solid" isBusy={isBusy} disabled={!reason.trim()}>
        {t("override.save")}
      </Button>
      <Button variant="quiet" onClick={onCancel}>
        {t("override.cancel")}
      </Button>
    </form>
  );
}

export function AlertList({ detail }: { detail: ClaimDetail }) {
  const { t } = useTranslation("documents");
  const { pick } = useLang();
  const attach = useAttachDocument(detail.claim.id);
  const override = useOverrideCheck(detail.claim.id);
  const [overriding, setOverriding] = useState<string | null>(null);
  const alerts = buildAlerts(detail);

  if (!alerts.length)
    return (
      <p className="rounded-2xl bg-secondary p-5 text-lg font-bold text-ink">
        {t("alerts.allClear")}
      </p>
    );

  return (
    <section aria-labelledby="alerts-title">
      <h2 id="alerts-title" className="mb-3 text-xl font-bold text-on-dominant">
        {t("alerts.title", { count: alerts.length })}
      </h2>
      <ul className="space-y-3">
        {alerts.map((a) =>
          a.kind === "missing" ? (
            <AlertItem
              key={`m-${a.code}`}
              severity="missing"
              title={t("alerts.missing", { item: t(`item.${a.code}`) })}
              fix={t(`fix.${a.code}`, { defaultValue: t("alerts.missingFix") })}
              actions={
                <UploadSlot
                  compact
                  label={t(`item.${a.code}`)}
                  onUpload={(file, name) =>
                    attach.mutateAsync({ file, name, checklistItem: a.code }).then(() => undefined)
                  }
                />
              }
            />
          ) : (
            <AlertItem
              key={a.check.id}
              severity={a.check.severity}
              title={pick(a.check.message)}
              fix={pick(a.check.fix)}
              documentName={a.document.file_name}
              bbox={a.check.bbox}
              overriddenReason={a.check.overridden_reason}
              actions={
                a.check.overridden_reason ? undefined : overriding === a.check.id ? (
                  <OverrideForm
                    isBusy={override.isPending}
                    onCancel={() => setOverriding(null)}
                    onSave={(reason) =>
                      override.mutate(
                        { checkId: a.check.id, reason },
                        { onSuccess: () => setOverriding(null) },
                      )
                    }
                  />
                ) : (
                  <>
                    <div className="w-full sm:w-auto sm:min-w-72">
                      <UploadSlot
                        compact
                        label={t("alerts.reupload")}
                        onUpload={(file, name) =>
                          attach
                            .mutateAsync({
                              file,
                              name,
                              checklistItem: a.document.checklist_item,
                              replaces: a.document.id,
                            })
                            .then(() => undefined)
                        }
                      />
                    </div>
                    <Button variant="quiet" onClick={() => setOverriding(a.check.id)}>
                      {t("override.open")}
                    </Button>
                  </>
                )
              }
            />
          ),
        )}
      </ul>
    </section>
  );
}
