import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Track } from "@/shared/config/app";
import { createClaim, getClaim, listClaims, type NewClaim } from "../api";

export const claimKey = (id: string | undefined) => ["claim", id] as const;

export const useClaims = (track: Track) =>
  useQuery({ queryKey: ["claims", track], queryFn: () => listClaims(track) });

/** Claim detail; polls while any document is still being checked. */
export const useClaim = (id: string | undefined) =>
  useQuery({
    queryKey: claimKey(id),
    queryFn: () => getClaim(id ?? ""),
    enabled: Boolean(id),
    refetchInterval: (q) =>
      q.state.data?.documents.some((d) => d.status === "checking") ? 1000 : false,
  });

export function useCreateClaim(track: Track) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewClaim) => createClaim(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["claims", track] });
      void qc.invalidateQueries({ queryKey: ["dashboard", track] });
    },
  });
}
