/** Typed calls for claim documents and checks (PRD §3.3, §6.2). */
import type { CheckResult } from "@/shared/api/contract";
import { api } from "@/shared/lib/apiClient";

export async function attachDocument(
  claimId: string,
  body: { file: Blob; name: string; checklistItem: string; replaces?: string },
) {
  const { file_id, upload_url } = await api<{ file_id: string; upload_url: string | null }>(
    "POST",
    "/files/upload-url",
    { file_name: body.name, mime: body.file.type, size: body.file.size },
  );
  if (upload_url)
    await fetch(upload_url, {
      method: "PUT",
      body: body.file,
      headers: { "Content-Type": body.file.type },
    });
  return api<{ document_id: string; job_id: string }>("POST", `/claims/${claimId}/documents`, {
    file_id,
    checklist_item: body.checklistItem,
    file_name: body.name,
    replaces: body.replaces,
  });
}

export const overrideCheck = (claimId: string, checkId: string, reason: string) =>
  api<CheckResult>("POST", `/claims/${claimId}/checks/${checkId}/override`, { reason });
