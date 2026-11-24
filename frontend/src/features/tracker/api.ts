/** Typed calls for the claim tracker (PRD §3.5, §3.8). */
import type { ClaimDetail, Escalation, WhatsAppMessage } from "@/shared/api/contract";
import { api } from "@/shared/lib/apiClient";

export const addStage = (claimId: string, stage_code: string, response_text: string | null) =>
  api<ClaimDetail>("POST", `/claims/${claimId}/stages`, { stage_code, response_text });
export const parseStage = (claimId: string, text: string) =>
  api<{ stage_code: string | null }>("POST", `/claims/${claimId}/stages/parse`, { text });
export const getEscalation = (claimId: string) =>
  api<Escalation>("GET", `/claims/${claimId}/escalation`);
export const getWhatsAppLog = (claimId: string) =>
  api<WhatsAppMessage[]>("GET", `/claims/${claimId}/whatsapp-log`);
