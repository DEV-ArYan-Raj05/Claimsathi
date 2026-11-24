/**
 * Which kind of Supabase key the frontend was given. Only a publishable key (sb_publishable_…) or the
 * legacy anon JWT may reach the browser. A secret key (sb_secret_…) or legacy service_role JWT
 * bypasses Row Level Security, and Supabase answers any browser request carrying one with HTTP 401
 * ("Forbidden use of secret API key in browser"). Pure: used by app.ts and vite.config.ts.
 */
export type SupabaseKeyKind =
  "publishable" | "anon" | "secret" | "serviceRole" | "missing" | "unknown";

function jwtRole(key: string): string | null {
  const payload = key.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export function supabaseKeyKind(key: string): SupabaseKeyKind {
  const k = key.trim();
  if (k === "") return "missing";
  if (k.startsWith("sb_publishable_")) return "publishable";
  if (k.startsWith("sb_secret_")) return "secret";
  const role = k.startsWith("eyJ") ? jwtRole(k) : null;
  if (role === "anon") return "anon";
  if (role === "service_role") return "serviceRole";
  return "unknown";
}

/** True for keys that must never be shipped to a browser. */
export function isPrivilegedKey(kind: SupabaseKeyKind): boolean {
  return kind === "secret" || kind === "serviceRole";
}
