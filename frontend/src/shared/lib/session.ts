/**
 * Auth session (PRD §3.7). Real mode uses Supabase Auth only — no custom auth code (rules.md §11) —
 * with exactly one auth listener for the whole app. Demo-auth mode (no Supabase env) keeps a
 * signed-in flag locally so judges can click through with the demo accounts.
 */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { IS_DEMO, IS_DEMO_AUTH, IS_SUPABASE_KEY_PRIVILEGED } from "../config/app";
import { readAuthLinkError } from "./authErrors";
import { logAuthError } from "./logger";
import { queryClient } from "./queryClient";
import { readStorage, writeStorage } from "./storage";
import { getSupabase } from "./supabase";

const DEMO_KEY = "cs.demo.session";

export type AuthStatus = "loading" | "signedIn" | "signedOut";
/** Why the user is signed out when they didn't press "Sign out" (shown on S-02). */
export type SignOutReason = "expired" | "restoreFailed" | null;

export interface SessionUser {
  id: string;
  email: string | null;
}

interface SessionState {
  status: AuthStatus;
  isSignedIn: boolean;
  /** False until the stored session has been restored: protected screens wait on this. */
  isReady: boolean;
  user: SessionUser | null;
  /** The session came from a password-recovery link (S-02 reset password). */
  isRecovery: boolean;
  signOutReason: SignOutReason;
}

const demoSignedIn = IS_DEMO_AUTH && readStorage(DEMO_KEY) === "1";

export const useSession = create<SessionState>(() => ({
  status: IS_DEMO_AUTH ? (demoSignedIn ? "signedIn" : "signedOut") : "loading",
  isSignedIn: demoSignedIn,
  isReady: IS_DEMO_AUTH,
  user: null,
  isRecovery: false,
  signOutReason: null,
}));

function setDemoSignedIn(value: boolean): void {
  writeStorage(DEMO_KEY, value ? "1" : "0");
  useSession.setState({
    status: value ? "signedIn" : "signedOut",
    isSignedIn: value,
    isReady: true,
  });
}

/** Demo data is kept per signed-in Supabase user, so two people on one phone never share it. */
const demoAccountFor = (userId: string) => `sb_${userId}`;

interface ApplyOptions {
  isRecovery?: boolean;
  reason?: SignOutReason;
}

/** Put a Supabase session into the store. Idempotent: boot and every auth event call it. */
export async function applySession(session: Session | null, opts: ApplyOptions = {}) {
  const next: SessionUser | null = session
    ? { id: session.user.id, email: session.user.email ?? null }
    : null;
  const prev = useSession.getState();
  if (next?.id !== prev.user?.id) {
    // A different person (or nobody): never show the previous user's cached data.
    queryClient.clear();
    if (IS_DEMO && next) {
      const { setDemoAccount } = await import("./demo/db");
      setDemoAccount(demoAccountFor(next.id));
    }
  }
  useSession.setState({
    status: next ? "signedIn" : "signedOut",
    isSignedIn: next !== null,
    isReady: true,
    user: next,
    isRecovery: next
      ? Boolean(opts.isRecovery) || (prev.isRecovery && prev.user?.id === next.id)
      : false,
    signOutReason: next ? null : (opts.reason ?? prev.signOutReason),
  });
}

let isSigningOut = false;

function onAuthEvent(event: AuthChangeEvent, session: Session | null): void {
  // Decide synchronously: signOut() resets the flag right after this event fires.
  const isExpired = event === "SIGNED_OUT" && !isSigningOut && useSession.getState().isSignedIn;
  // No Supabase calls in here (supabase-js warns they can deadlock inside the callback).
  void applySession(session, {
    isRecovery: event === "PASSWORD_RECOVERY",
    reason: isExpired ? "expired" : null,
  });
}

let started: Promise<void> | null = null;

async function start(): Promise<void> {
  try {
    const sb = await getSupabase();
    sb.auth.onAuthStateChange(onAuthEvent);
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    await applySession(data.session);
  } catch (err) {
    // The stored session couldn't be restored (offline, revoked, bad link): signed out, and S-02
    // says so. An auth-link error, or a wrong key, is explained by the page itself instead.
    logAuthError("restoreSession", err);
    const isExplainedElsewhere = readAuthLinkError() !== null || IS_SUPABASE_KEY_PRIVILEGED;
    await applySession(null, { reason: isExplainedElsewhere ? null : "restoreFailed" });
  }
}

/** Restore the session and subscribe to auth changes. Safe to call more than once. */
export function initSession(): Promise<void> {
  if (IS_DEMO_AUTH) return Promise.resolve();
  started ??= start();
  return started;
}

export async function getAccessToken(): Promise<string | null> {
  if (IS_DEMO_AUTH) return null;
  const { data } = await (await getSupabase()).auth.getSession();
  return data.session?.access_token ?? null;
}

/** The API rejected our token (expired or revoked): drop it so guards send the user to S-02. */
export async function expireSession(): Promise<void> {
  if (IS_DEMO_AUTH || !useSession.getState().isSignedIn) return;
  await (await getSupabase()).auth.signOut({ scope: "local" });
}

/**
 * Sign out of this device. scope "local" removes the stored session before the network call, so
 * the app is signed out even offline; the request then revokes the refresh token on Supabase.
 * Resolves to false when that server-side revoke failed (the device is still signed out).
 */
export async function signOut(): Promise<boolean> {
  if (IS_DEMO_AUTH) {
    queryClient.clear();
    setDemoSignedIn(false);
    return true;
  }
  const userId = useSession.getState().user?.id;
  isSigningOut = true;
  try {
    const { error } = await (await getSupabase()).auth.signOut({ scope: "local" });
    return error === null;
  } catch {
    return false;
  } finally {
    isSigningOut = false;
    await applySession(null, { reason: null });
    useSession.setState({ signOutReason: null });
    if (IS_DEMO && userId) {
      // Shared phones (CSC operators, family): don't leave this person's data in the browser.
      const { deleteDemoDb } = await import("./demo/db");
      deleteDemoDb(demoAccountFor(userId));
    }
  }
}

/** Demo mode: switch the in-browser database to this account and mark the session signed in. */
async function demoSignIn(accountId: string): Promise<void> {
  const { setDemoAccount } = await import("./demo/db");
  setDemoAccount(accountId);
  queryClient.clear();
  setDemoSignedIn(true);
}

/**
 * Demo-only email + password sign-in against the test accounts in demo/accounts.ts.
 * Returns where that account should land. Real mode uses Supabase Auth (authEmail.ts).
 */
export async function signInWithDemoAccount(email: string, password: string): Promise<string> {
  if (!IS_DEMO_AUTH || !IS_DEMO) throw new Error("Demo sign-in is only available in demo mode");
  const { findDemoAccount } = await import("./demo/accounts");
  const account = findDemoAccount(email, password);
  if (!account) throw new Error("Unknown demo account");
  await demoSignIn(account.id);
  return account.home;
}

async function demoDefaultSignIn(): Promise<void> {
  const { DEFAULT_DEMO_ACCOUNT } = await import("./demo/accounts");
  await demoSignIn(DEFAULT_DEMO_ACCOUNT);
}

/** S-02 primary: Google OAuth with openid/email/profile scopes only. */
export async function signInWithGoogle(): Promise<void> {
  if (IS_DEMO_AUTH) return demoDefaultSignIn();
  const { error } = await (
    await getSupabase()
  ).auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: "openid email profile",
    },
  });
  if (error) throw error;
}

/** S-02 fallback: WhatsApp OTP sign-in. */
export async function sendSignInOtp(phone: string): Promise<void> {
  if (IS_DEMO_AUTH) return;
  const { error } = await (
    await getSupabase()
  ).auth.signInWithOtp({ phone, options: { channel: "whatsapp" } });
  if (error) throw error;
}

export async function verifySignInOtp(phone: string, token: string): Promise<void> {
  if (IS_DEMO_AUTH) return demoDefaultSignIn();
  // The auth listener picks up the new session; no manual state change needed.
  const { error } = await (await getSupabase()).auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
}

/** S-03: attach a WhatsApp number to the signed-in user (phone_change flow). */
export async function sendNumberOtp(phone: string): Promise<void> {
  if (IS_DEMO_AUTH) return;
  const { error } = await (await getSupabase()).auth.updateUser({ phone });
  if (error) throw error;
}

export async function verifyNumberOtp(phone: string, token: string): Promise<void> {
  if (IS_DEMO_AUTH) return;
  const { error } = await (
    await getSupabase()
  ).auth.verifyOtp({ phone, token, type: "phone_change" });
  if (error) throw error;
}

/** x-11: link Google to a phone-only account (manual identity linking enabled in Supabase). */
export async function linkGoogle(): Promise<void> {
  if (IS_DEMO_AUTH) return;
  const { error } = await (await getSupabase()).auth.linkIdentity({ provider: "google" });
  if (error) throw error;
}
