/** Typed calls for /me, /members, /land-parcels (profile is owned by backend feature `profile`). */
import type { LandParcel, Member, Profile } from "@/shared/api/contract";
import { HAS_SUPABASE, IS_DEMO } from "@/shared/config/app";
import { api } from "@/shared/lib/apiClient";
import {
  confirmMyWhatsApp,
  deleteMyProfile,
  fetchMyProfile,
  updateMyProfile,
} from "./profileSupabase";

/**
 * Real Supabase Auth but no API yet: the profile lives in Supabase `profiles` (RLS), and a copy goes
 * to the in-browser demo server so claim letters use the real name. With the API, /me owns it.
 */
const PROFILE_IN_SUPABASE = HAS_SUPABASE && IS_DEMO;

async function mirrored(profile: Promise<Profile>): Promise<Profile> {
  const p = await profile;
  await api<Profile>("PATCH", "/me", p);
  return p;
}

export const getMe = () =>
  PROFILE_IN_SUPABASE ? mirrored(fetchMyProfile()) : api<Profile>("GET", "/me");
export const patchMe = (body: Partial<Profile>) =>
  PROFILE_IN_SUPABASE ? mirrored(updateMyProfile(body)) : api<Profile>("PATCH", "/me", body);
export const deleteMe = () =>
  PROFILE_IN_SUPABASE
    ? deleteMyProfile().then(() => api<null>("DELETE", "/me"))
    : api<null>("DELETE", "/me");
export const confirmWhatsApp = (phone: string) =>
  PROFILE_IN_SUPABASE
    ? mirrored(confirmMyWhatsApp(phone))
    : api<Profile>("POST", "/me/whatsapp/confirm", { phone });
export const setWhatsAppOptIn = (optIn: boolean, lang: string) =>
  PROFILE_IN_SUPABASE
    ? mirrored(updateMyProfile({ whatsapp_opt_in: optIn, whatsapp_lang: lang }))
    : api<Profile>("PATCH", "/me/whatsapp", { opt_in: optIn, lang });
export const getMembers = () => api<Member[]>("GET", "/members");
export const addMember = (body: Omit<Member, "id">) => api<Member>("POST", "/members", body);
export const getParcels = () => api<LandParcel[]>("GET", "/land-parcels");
export const addParcel = (body: Omit<LandParcel, "id">) =>
  api<LandParcel>("POST", "/land-parcels", body);
