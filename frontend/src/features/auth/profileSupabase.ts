/**
 * Profile stored in Supabase `profiles` (supabase/migrations/*_auth_profiles*.sql), used while the
 * FastAPI /me router is still TODO. Row-level security limits every query to the signed-in user's
 * own row; trusted columns (email, WhatsApp verification) can only change through SQL functions.
 */
import type { Profile } from "@/shared/api/contract";
import { useSession } from "@/shared/lib/session";
import { getSupabase } from "@/shared/lib/supabase";

const COLUMNS =
  "id,name,email,language,state,district,last_track,tracks,call_consent," +
  "whatsapp_phone,whatsapp_verified_at,whatsapp_opt_in,is_onboarded";

/** Columns the signed-in user may change (mirrors the column grants in the migration). */
const EDITABLE = [
  "name",
  "language",
  "state",
  "district",
  "last_track",
  "tracks",
  "call_consent",
  "whatsapp_opt_in",
  "is_onboarded",
] as const;

type ProfileRow = Omit<Profile, "bank_last4" | "name" | "email"> & {
  name: string | null;
  email: string | null;
};

function toProfile(row: ProfileRow): Profile {
  // Bank details are never stored in profiles (rules.md §10); the claim form asks for them.
  return { ...row, name: row.name ?? "", email: row.email ?? "", bank_last4: null };
}

function userId(): string {
  const id = useSession.getState().user?.id;
  if (!id) throw new Error("AUTH_REQUIRED");
  return id;
}

export async function fetchMyProfile(): Promise<Profile> {
  const sb = await getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId())
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  if (data) return toProfile(data);
  // Row missing (signed up before the migration, or deleted via "Delete my data"): recreate it
  // from the auth record on the server side.
  const created = await sb.rpc("ensure_my_profile").select(COLUMNS).single<ProfileRow>();
  if (created.error) throw created.error;
  return toProfile(created.data);
}

export async function updateMyProfile(
  patch: Partial<Profile> & { whatsapp_lang?: string },
): Promise<Profile> {
  const allowed: Record<string, unknown> = {};
  for (const key of [...EDITABLE, "whatsapp_lang"] as const) {
    if (key in patch) allowed[key] = patch[key];
  }
  const { data, error } = await (
    await getSupabase()
  )
    .from("profiles")
    .update(allowed)
    .eq("id", userId())
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}

/** After verifyOtp(phone_change): the database checks the number is confirmed on this user. */
export async function confirmMyWhatsApp(phone: string): Promise<Profile> {
  const { data, error } = await (
    await getSupabase()
  )
    .rpc("confirm_my_whatsapp", { p_phone: phone })
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}

/**
 * "Delete my data": removes the profile row. TODO(PRD §8): deleting the auth account and stored
 * files needs the backend (service role) — the browser can't and shouldn't do that.
 */
export async function deleteMyProfile(): Promise<null> {
  const { error } = await (await getSupabase()).from("profiles").delete().eq("id", userId());
  if (error) throw error;
  return null;
}
