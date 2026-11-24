/** Document checklist for the track with an upload slot per item and per-document check results. */
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClaimDetail, ClaimDocument } from "@/shared/api/contract";
import { UploadSlot } from "@/shared/components/UploadSlot";
import { Card } from "@/shared/ui/card";
import { useAttachDocument } from "../hooks/useDocuments";

function DocLine({ doc }: { doc: ClaimDocument }) {
  const { t } = useTranslation("documents");
  const passed = doc.checks.filter((c) => c.passed || c.overridden_reason).length;
  const isClean = passed === doc.checks.length;
  return (
    <li className="flex items-center gap-2 text-base">
      {doc.status === "checking" ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : isClean ? (
        <CheckCircle2 aria-hidden className="h-4 w-4 text-success" />
      ) : (
        <XCircle aria-hidden className="h-4 w-4" />
      )}
      <span className="truncate">{doc.file_name}</span>
      <span className="ml-auto shrink-0 text-sm text-caption">
        {doc.status === "checking"
          ? t("checklist.checking")
          : t("checklist.passed", { passed, total: doc.checks.length })}
      </span>
    </li>
  );
}

export function ChecklistSection({ detail }: { detail: ClaimDetail }) {
  const { t } = useTranslation("documents");
  const attach = useAttachDocument(detail.claim.id);
  return (
    <Card>
      <h2 className="text-xl font-bold">{t("checklist.title")}</h2>
      <ul className="mt-4 divide-y divide-ink/10">
        {detail.checklist.map((item) => {
          const docs = detail.documents.filter((d) => d.checklist_item === item.code);
          const Icon = item.uploaded ? CheckCircle2 : Circle;
          return (
            <li key={item.code} className="space-y-3 py-4">
              <div className="flex items-start gap-3">
                <Icon
                  aria-hidden
                  className={
                    item.uploaded ? "mt-1 h-5 w-5 text-success" : "mt-1 h-5 w-5 text-ink/40"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">{t(`item.${item.code}`)}</p>
                  <p className="text-sm text-caption">
                    {item.required ? t("checklist.required") : t("checklist.optional")}
                  </p>
                </div>
              </div>
              {docs.length > 0 && (
                <ul className="space-y-1 pl-8">
                  {docs.map((d) => (
                    <DocLine key={d.id} doc={d} />
                  ))}
                </ul>
              )}
              <div className="pl-8">
                <UploadSlot
                  compact
                  label={t(`item.${item.code}`)}
                  onUpload={(file, name) =>
                    attach
                      .mutateAsync({ file, name, checklistItem: item.code })
                      .then(() => undefined)
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
