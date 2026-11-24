/**
 * Two-option toggle fixed in the top bar (PRD §2). Switching keeps the equivalent route
 * (/health/policies → /crop/policies), saves the choice, and plays a 400 ms cross-fade.
 */
import { HeartPulse, Wheat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { TRACKS, type Track } from "../config/app";
import { equivalentPath } from "../lib/trackPath";
import { usePrefs } from "../lib/prefs";
import { cn } from "../lib/cn";
import { useTrack } from "../hooks/useTrack";
import { startTrackCrossfade } from "../lib/crossfade";

const ICONS: Record<Track, typeof Wheat> = { health: HeartPulse, crop: Wheat };

export function TrackSwitcher() {
  const { t } = useTranslation();
  const current = useTrack();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setLastTrack = usePrefs((s) => s.setLastTrack);

  const go = (to: Track) => {
    if (to === current) return;
    startTrackCrossfade();
    setLastTrack(to);
    navigate(equivalentPath(pathname, to));
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("track.switcherLabel")}
      className="relative grid grid-cols-2 rounded-full bg-on-dominant/15 p-1"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-secondary transition-transform duration-track ease-out motion-reduce:transition-none",
          current === "crop" && "translate-x-full",
        )}
      />
      {TRACKS.map((track) => {
        const Icon = ICONS[track];
        const isOn = track === current;
        return (
          <button
            key={track}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => go(track)}
            className={cn(
              "relative z-10 flex min-h-[40px] min-w-tap items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors sm:px-4",
              isOn ? "text-ink" : "text-on-dominant",
            )}
          >
            <Icon aria-hidden className="h-4 w-4" />
            {t(`track.${track}`)}
          </button>
        );
      })}
    </div>
  );
}
