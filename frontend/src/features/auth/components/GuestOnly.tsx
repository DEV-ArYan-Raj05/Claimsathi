/**
 * Guard for sign-in screens: wait for the session, then send signed-in users on — to where they
 * were going before S-02 (`from`), else onboarding or their track home. RequireAuth is the opposite
 * guard; each redirects only on the condition the other excludes, so they can't loop.
 */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SkeletonList } from "@/shared/components/Skeleton";
import { useSession } from "@/shared/lib/session";
import { useHomePath } from "../hooks/useProfile";
import { safeFrom } from "../redirect";

export function AuthLoading() {
  return (
    <div className="p-6">
      <SkeletonList />
    </div>
  );
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { isReady, isSignedIn, isRecovery } = useSession();
  const home = useHomePath();
  const from = safeFrom(useLocation().state);
  if (!isReady) return <AuthLoading />;
  if (!isSignedIn) return <>{children}</>;
  if (isRecovery) return <Navigate to="/reset-password" replace />;
  if (home === null) return <AuthLoading />;
  return <Navigate to={from ?? home} replace />;
}
