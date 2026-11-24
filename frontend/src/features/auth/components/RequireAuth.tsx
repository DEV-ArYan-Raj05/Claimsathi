import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/shared/lib/session";
import { useProfile } from "../hooks/useProfile";
import { AuthLoading } from "./GuestOnly";

/**
 * Signed-out → /login (remembering where they were going). Signed in but not onboarded →
 * /onboarding. Nothing protected renders until the stored session has been restored.
 * This is UX only: the data itself is protected by RLS / the API's JWT check.
 */
export function RequireAuth({
  children,
  allowUnonboarded = false,
}: {
  children: ReactNode;
  allowUnonboarded?: boolean;
}) {
  const { isSignedIn, isReady } = useSession();
  const profile = useProfile();
  const location = useLocation();
  if (!isReady || (isSignedIn && profile.isPending)) return <AuthLoading />;
  if (!isSignedIn)
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  if (!allowUnonboarded && profile.data && !profile.data.is_onboarded)
    return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
