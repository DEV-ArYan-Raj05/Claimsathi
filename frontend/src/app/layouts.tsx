/** Root layout keeps <html data-track> and lang in sync with the route; TrackGate validates :track. */
import { Suspense, useEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { RecoveryRedirect } from "@/features/auth";
import { TrackCrossfade } from "@/shared/components/TrackCrossfade";
import { isTrack } from "@/shared/config/app";
import { usePrefs } from "@/shared/lib/prefs";

export function RootLayout() {
  const { pathname } = useLocation();
  const lastTrack = usePrefs((s) => s.lastTrack);
  const language = usePrefs((s) => s.language);
  const first = pathname.split("/")[1];
  const track = isTrack(first) ? first : lastTrack;

  useEffect(() => {
    document.documentElement.dataset.track = track;
  }, [track]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <TrackCrossfade />
      <RecoveryRedirect />
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </>
  );
}

export function TrackGate() {
  const { track } = useParams();
  const setLastTrack = usePrefs((s) => s.setLastTrack);
  const isValid = isTrack(track);
  useEffect(() => {
    if (isTrack(track)) setLastTrack(track);
  }, [track, setLastTrack]);
  return isValid ? <Outlet /> : <Navigate to="/" replace />;
}
