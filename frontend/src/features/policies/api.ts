/** Typed calls to /api/v1/policies/* (PRD §6.2). */
import type { AskAnswer, Policy, PolicySummary } from "@/shared/api/contract";
import type { Language, Track } from "@/shared/config/app";
import { api } from "@/shared/lib/apiClient";

export const listPolicies = (track: Track) =>
  api<PolicySummary[]>("GET", `/policies?track=${track}`);
export const getPolicy = (id: string) => api<Policy>("GET", `/policies/${id}`);
export const patchPolicy = (id: string, body: Partial<Policy>) =>
  api<Policy>("PATCH", `/policies/${id}`, body);
export const askPolicy = (id: string, question: string, lang: Language) =>
  api<AskAnswer>("POST", `/policies/${id}/ask`, { question, lang });

/** Upload flow: signed URL → (PUT to storage in real mode) → POST /policies starts extract_policy. */
export async function createPolicy(track: Track, file: Blob, name: string) {
  const { file_id, upload_url } = await api<{ file_id: string; upload_url: string | null }>(
    "POST",
    "/files/upload-url",
    { file_name: name, mime: file.type, size: file.size },
  );
  if (upload_url)
    await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return api<{ policy_id: string; job_id: string }>("POST", "/policies", { file_id, track });
}
