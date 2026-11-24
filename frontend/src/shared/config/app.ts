/** Product-wide constants. The product name lives here only (rules.md §17). */
import { isPrivilegedKey, supabaseKeyKind } from "./supabaseKey";
export const APP_NAME = "ClaimSathi";

export const TRACKS = ["health", "crop"] as const;
export type Track = (typeof TRACKS)[number];

export const LANGUAGES = ["en", "hi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const MAX_UPLOAD_MB = 20;
export const UPLOAD_MAX_EDGE_PX = 1600;
export const UPLOAD_JPEG_QUALITY = 0.8;
export const TRACK_SWITCH_MS = 400;

/** Empty VITE_API_BASE_URL = run on in-browser demo data, no backend needed. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";
export const IS_DEMO = API_BASE_URL === "";
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
/** Publishable key (sb_publishable_…). The legacy anon key name still works as a fallback. */
export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
/** "secret"/"serviceRole" here means the wrong key was pasted (vite.config.ts also refuses it). */
export const SUPABASE_KEY_KIND = supabaseKeyKind(SUPABASE_PUBLISHABLE_KEY);
export const IS_SUPABASE_KEY_PRIVILEGED = isPrivilegedKey(SUPABASE_KEY_KIND);
/** Real Supabase Auth is on whenever the project URL and publishable key are set. */
export const HAS_SUPABASE = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";
/** Demo accounts are used only when Supabase isn't configured (no-env hackathon demo). */
export const IS_DEMO_AUTH = !HAS_SUPABASE;
/**
 * FastAPI for the assistant (POST /api/v1/chat). With VITE_API_BASE_URL empty the other screens
 * still run on demo data, so VITE_CHAT_API_BASE_URL can point just the assistant at the backend.
 * "/" means the same origin (on Vercel the backend service is routed at /api on the same domain).
 */
export const CHAT_API_BASE_URL: string =
  API_BASE_URL || (import.meta.env.VITE_CHAT_API_BASE_URL ?? "");
/** The live assistant needs the backend and a real Supabase session (the API checks the JWT). */
export const IS_LIVE_CHAT = CHAT_API_BASE_URL !== "" && HAS_SUPABASE;
/** Real API without Supabase can't sign anyone in: S-02 shows a setup message instead. */
export const IS_AUTH_MISCONFIGURED = !IS_DEMO && !HAS_SUPABASE;

/** Mock insurer console (/admin/mock-insurer) exists only in demo or when explicitly enabled. */
export const MOCK_INSURER_ENABLED = IS_DEMO || import.meta.env.VITE_ENABLE_MOCK_INSURER === "true";

export function isTrack(value: unknown): value is Track {
  return typeof value === "string" && (TRACKS as readonly string[]).includes(value);
}
