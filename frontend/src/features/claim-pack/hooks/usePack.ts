import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claimKey } from "@/features/claims";
import { buildPack, submitClaim } from "../api";

export const usePack = (claimId: string | undefined) =>
  useQuery({
    queryKey: ["pack", claimId],
    queryFn: () => buildPack(claimId ?? ""),
    enabled: Boolean(claimId),
  });

export function useSubmitClaim(claimId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channel: "email" | "portal" | "in_person") => submitClaim(claimId, channel),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: claimKey(claimId) });
      void qc.invalidateQueries({ queryKey: ["claims", c.track] });
      void qc.invalidateQueries({ queryKey: ["dashboard", c.track] });
    },
  });
}
