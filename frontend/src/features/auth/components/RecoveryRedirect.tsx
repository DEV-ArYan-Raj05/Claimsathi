/**
 * If a password-recovery link lands anywhere other than /reset-password (Supabase falls back to the
 * Site URL when the redirect URL isn't allow-listed), take the user to the reset form once.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/shared/lib/session";

export function RecoveryRedirect() {
  const isRecovery = useSession((s) => s.isRecovery);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (isRecovery && pathname !== "/reset-password")
      navigate("/reset-password", { replace: true });
    // Only when recovery starts, so the user can still leave the reset screen afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname intentionally excluded
  }, [isRecovery, navigate]);
  return null;
}
