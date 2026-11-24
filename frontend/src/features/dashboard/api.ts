import type { Dashboard } from "@/shared/api/contract";
import type { Track } from "@/shared/config/app";
import { api } from "@/shared/lib/apiClient";

/** GET /dashboard?track= — counts, average score, next deadline. */
export const getDashboard = (track: Track) => api<Dashboard>("GET", `/dashboard?track=${track}`);
