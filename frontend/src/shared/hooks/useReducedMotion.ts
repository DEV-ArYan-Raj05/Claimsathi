import { useMediaQuery } from "./useMediaQuery";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/** True when the user asked for less motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** rules.md §7: no scroll animation on devices reporting under 4 GB RAM. */
export function isLowMemoryDevice(): boolean {
  const memory = (navigator as NavigatorWithMemory).deviceMemory;
  return typeof memory === "number" && memory < 4;
}
