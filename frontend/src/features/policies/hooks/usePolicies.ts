import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Policy } from "@/shared/api/contract";
import type { Language, Track } from "@/shared/config/app";
import { askPolicy, createPolicy, getPolicy, listPolicies, patchPolicy } from "../api";

export const usePolicies = (track: Track) =>
  useQuery({ queryKey: ["policies", track], queryFn: () => listPolicies(track) });

export const usePolicy = (id: string | undefined, poll = false) =>
  useQuery({
    queryKey: ["policy", id],
    queryFn: () => getPolicy(id ?? ""),
    enabled: Boolean(id),
    refetchInterval: (q) => (poll && q.state.data?.status === "processing" ? 1000 : false),
  });

export function useCreatePolicy(track: Track) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: Blob; name: string }) => createPolicy(track, file, name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["policies", track] }),
  });
}

export function usePatchPolicy(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Policy>) => patchPolicy(id, body),
    onSuccess: (p) => {
      qc.setQueryData(["policy", id], p);
      void qc.invalidateQueries({ queryKey: ["policies", p.track] });
    },
  });
}

export const useAskPolicy = (id: string) =>
  useMutation({
    mutationFn: ({ question, lang }: { question: string; lang: Language }) =>
      askPolicy(id, question, lang),
  });
