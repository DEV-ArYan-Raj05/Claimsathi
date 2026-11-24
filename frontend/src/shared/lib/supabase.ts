/**
 * The one Supabase client (PRD §3.7, rules.md §11). Created lazily so supabase-js stays out of the
 * initial bundle. Only the public URL + publishable key are used here; secret keys never reach the
 * browser (rules.md §10).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HAS_SUPABASE,
  IS_SUPABASE_KEY_PRIVILEGED,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "../config/app";

let client: Promise<SupabaseClient> | null = null;

/** Shared client: persists the session in localStorage, refreshes tokens, reads auth links. */
export function getSupabase(): Promise<SupabaseClient> {
  if (!HAS_SUPABASE) return Promise.reject(new Error("SUPABASE_NOT_CONFIGURED"));
  // A secret / service_role key must never be sent from a browser: Supabase rejects it with 401,
  // and it would bypass RLS if it weren't. Fail clearly instead of calling the API with it.
  if (IS_SUPABASE_KEY_PRIVILEGED)
    return Promise.reject(new Error("SUPABASE_SECRET_KEY_IN_BROWSER"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Picks up the session from email-confirmation, recovery and OAuth redirects.
        // Implicit flow (the supabase-js default) so a link opened on another device still works;
        // PKCE would need the code verifier stored in the browser that started the flow.
        detectSessionInUrl: true,
      },
    }),
  );
  return client;
}
