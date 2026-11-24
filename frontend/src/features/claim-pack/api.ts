/** Typed calls for the claim pack and submission (PRD §3.2). */
import type { Claim, ClaimPack } from "@/shared/api/contract";
import { api } from "@/shared/lib/apiClient";

/** TODO(PRD §7.1): in production this enqueues `build_pack` and returns {job_id}; poll then fetch. */
export const buildPack = (claimId: string) => api<ClaimPack>("POST", `/claims/${claimId}/pack`);
export const submitClaim = (claimId: string, channel: "email" | "portal" | "in_person") =>
  api<Claim>("POST", `/claims/${claimId}/submit`, { channel });
