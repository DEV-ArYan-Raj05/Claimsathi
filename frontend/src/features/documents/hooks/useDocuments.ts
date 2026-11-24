import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimKey } from "@/features/claims";
import { attachDocument, overrideCheck } from "../api";

export function useAttachDocument(claimId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof attachDocument>[1]) => attachDocument(claimId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: claimKey(claimId) }),
  });
}

export function useOverrideCheck(claimId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, reason }: { checkId: string; reason: string }) =>
      overrideCheck(claimId, checkId, reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: claimKey(claimId) }),
  });
}
