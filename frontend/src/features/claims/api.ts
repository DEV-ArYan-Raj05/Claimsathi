/** Typed calls to /api/v1/claims (create, list, detail). */
import type { Claim, ClaimDetail, IncidentValue } from "@/shared/api/contract";
import type { Track } from "@/shared/config/app";
import { api } from "@/shared/lib/apiClient";

export interface NewClaim {
  policy_id: string;
  event_at: string;
  amount_claimed: string;
  incident: Record<string, IncidentValue>;
}

export const listClaims = (track: Track) => api<Claim[]>("GET", `/claims?track=${track}`);
export const createClaim = (body: NewClaim) => api<Claim>("POST", "/claims", body);
export const getClaim = (id: string) => api<ClaimDetail>("GET", `/claims/${id}`);
