import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claimKey } from "@/features/claims";
import { addStage, getEscalation, getWhatsAppLog, parseStage } from "../api";

export function useAddStage(claimId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, text }: { code: string; text: string | null }) =>
      addStage(claimId, code, text),
    onSuccess: (d) => qc.setQueryData(claimKey(claimId), d),
  });
}

export const useParseStage = (claimId: string) =>
  useMutation({ mutationFn: (text: string) => parseStage(claimId, text) });
export const useEscalation = (claimId: string, enabled: boolean) =>
  useQuery({ queryKey: ["escalation", claimId], queryFn: () => getEscalation(claimId), enabled });
export const useWhatsAppLog = (claimId: string) =>
  useQuery({ queryKey: ["wa-log", claimId], queryFn: () => getWhatsAppLog(claimId) });
