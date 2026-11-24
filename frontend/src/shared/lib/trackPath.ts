import { TRACKS, type Track } from "../config/app";

/** Same screen in the other track; claim/policy ids don't carry across, so drop to the list. */
export function equivalentPath(pathname: string, to: Track): string {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length || !(TRACKS as readonly string[]).includes(parts[0] ?? "")) return `/${to}`;
  const section = parts[1];
  if (!section) return `/${to}`;
  const sub = parts[2];
  return sub === "new" ? `/${to}/${section}/new` : `/${to}/${section}`;
}
