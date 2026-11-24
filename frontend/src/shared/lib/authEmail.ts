/**
 * Email + password sign-in through Supabase Auth (added alongside Google + WhatsApp, PRD §3.7).
 * Every call throws the Supabase error unchanged; screens classify and log it with
 * handleAuthError() (authErrors.ts), keeping its code, status and message.
 */
import { getSupabase } from "./supabase";

const callbackUrl = () => `${window.location.origin}/auth/callback`;
/** Must be listed under Auth → URL Configuration → Redirect URLs in Supabase. */
export const resetPasswordUrl = () => `${window.location.origin}/reset-password`;

export type SignUpResult = "signedIn" | "checkEmail";

/**
 * Create an account. With "Confirm email" on, Supabase sends a link and returns no session.
 * For an email that's already registered it also returns no session and sends nothing (so nobody
 * can probe which emails have accounts); the screen tells the user to sign in or reset instead.
 */
export async function signUpWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  const { data, error } = await (
    await getSupabase()
  ).auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: callbackUrl(), data: { full_name: input.fullName } },
  });
  if (error) throw error;
  return data.session ? "signedIn" : "checkEmail";
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  // The auth listener (session.ts) picks up the new session.
  const { error } = await (await getSupabase()).auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await (
    await getSupabase()
  ).auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl() } });
  if (error) throw error;
}

/** Sends the recovery email. Succeeds for unknown emails too, so accounts can't be probed. */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await (
    await getSupabase()
  ).auth.resetPasswordForEmail(email, { redirectTo: resetPasswordUrl() });
  if (error) throw error;
}

/** Needs the session from the recovery link (or a normal signed-in session). */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await (await getSupabase()).auth.updateUser({ password });
  if (error) throw error;
}
