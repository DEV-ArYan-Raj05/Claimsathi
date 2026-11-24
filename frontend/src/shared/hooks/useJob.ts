import { useQuery } from "@tanstack/react-query";
import type { Job } from "../api/contract";
import { api } from "../lib/apiClient";

const POLL_MS = 900;

/** Poll GET /jobs/{id} until the job is done or failed (long work never blocks a request). */
export function useJob(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api<Job>("GET", `/jobs/${jobId ?? ""}`),
    enabled: Boolean(jobId),
    refetchInterval: (q) =>
      q.state.data && ["done", "failed"].includes(q.state.data.status) ? false : POLL_MS,
  });
}
