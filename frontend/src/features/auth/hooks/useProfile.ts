import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/shared/api/contract";
import { useSession } from "@/shared/lib/session";
import { confirmWhatsApp, getMe, patchMe, setWhatsAppOptIn } from "../api";

export const PROFILE_KEY = ["me"] as const;

/** The signed-in user's profile. The cache is cleared whenever the user changes (session.ts). */
export function useProfile() {
  const isSignedIn = useSession((s) => s.isSignedIn);
  return useQuery({ queryKey: PROFILE_KEY, queryFn: getMe, enabled: isSignedIn });
}

/** Where a signed-in user belongs: onboarding first, then their last track's home (x-01). */
export function useHomePath(): string | null {
  const profile = useProfile();
  if (profile.isPending) return null;
  if (!profile.data || !profile.data.is_onboarded) return "/onboarding";
  return `/${profile.data.last_track}`;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Profile>) => patchMe(body),
    onSuccess: (data) => qc.setQueryData(PROFILE_KEY, data),
  });
}

export function useConfirmWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmWhatsApp,
    onSuccess: (data) => qc.setQueryData(PROFILE_KEY, data),
  });
}

export function useWhatsAppOptIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ optIn, lang }: { optIn: boolean; lang: string }) =>
      setWhatsAppOptIn(optIn, lang),
    onSuccess: (data) => qc.setQueryData(PROFILE_KEY, data),
  });
}
