/**
 * 400 ms colour cross-fade on track switch, done with opacity only (rules.md §7):
 * a fixed layer is painted in the OLD dominant colour, then faded out over the new theme.
 */
import { useEffect, useState } from "react";
import { TRACK_SWITCH_MS } from "../config/app";
import { crossfadeListeners, type CrossfadeListener } from "../lib/crossfade";

export function TrackCrossfade() {
  const [layer, setLayer] = useState<{ color: string; key: number } | null>(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const listener: CrossfadeListener = (color) => {
      setIsFading(false);
      setLayer({ color, key: Date.now() });
    };
    crossfadeListeners.add(listener);
    return () => {
      crossfadeListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!layer) return;
    const raf = requestAnimationFrame(() => setIsFading(true));
    const done = window.setTimeout(() => setLayer(null), TRACK_SWITCH_MS + 50);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [layer]);

  if (!layer) return null;
  return (
    <div
      key={layer.key}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] transition-opacity duration-track ease-out"
      style={{ backgroundColor: layer.color, opacity: isFading ? 0 : 0.85 }}
    />
  );
}
