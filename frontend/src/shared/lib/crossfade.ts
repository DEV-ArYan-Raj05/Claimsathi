/** Tiny event bus between TrackSwitcher (start) and TrackCrossfade (render). */
export type CrossfadeListener = (color: string) => void;
export const crossfadeListeners = new Set<CrossfadeListener>();

/** Call just before the theme changes; captures the current dominant colour. */
export function startTrackCrossfade(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-dominant");
  crossfadeListeners.forEach((l) => l(color));
}
