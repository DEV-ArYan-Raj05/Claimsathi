/**
 * Turn Supabase Auth errors into plain-language message keys (auth.errors.* in locales), while
 * keeping Supabase's own code, HTTP status and message so the screen can show them and nothing is
 * silently replaced by a generic "Something went wrong".
 */
import { logAuthError, safeAuthError, type SafeAuthError } from "./logger";

export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "emailTaken"
  | "weakPassword"
  | "samePassword"
  | "invalidEmail"
  | "emailNotAuthorized"
  | "emailProviderDisabled"
  | "rateLimited"
  | "signupDisabled"
  | "sessionExpired"
  | "linkExpired"
  | "notConfigured"
  | "secretKeyInBrowser"
  | "invalidApiKey"
  | "signupDatabaseError"
  | "serverUnavailable"
  | "network"
  | "generic";

/** Error codes from https://supabase.com/docs/guides/auth/debugging/error-codes */
const BY_CODE: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "emailTaken",
  email_exists: "emailTaken",
  weak_password: "weakPassword",
  same_password: "samePassword",
  email_address_invalid: "invalidEmail",
  validation_failed: "invalidEmail",
  // The built-in email service only sends to the project's team members until custom SMTP is set.
  email_address_not_authorized: "emailNotAuthorized",
  email_provider_disabled: "emailProviderDisabled",
  signup_disabled: "signupDisabled",
  over_email_send_rate_limit: "rateLimited",
  over_request_rate_limit: "rateLimited",
  session_not_found: "sessionExpired",
  session_expired: "sessionExpired",
  refresh_token_not_found: "sessionExpired",
  otp_expired: "linkExpired",
  flow_state_expired: "linkExpired",
  flow_state_not_found: "linkExpired",
};

/** Errors Supabase sends without a code, recognised by message (checked in order). */
const BY_MESSAGE: [RegExp, AuthErrorKey][] = [
  [/SUPABASE_NOT_CONFIGURED/, "notConfigured"],
  [/SUPABASE_SECRET_KEY_IN_BROWSER|secret api key in browser/i, "secretKeyInBrowser"],
  [/invalid api key|no api key found/i, "invalidApiKey"],
  [/database error (saving|creating|updating|granting)/i, "signupDatabaseError"],
  [/invalid login credentials/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/already registered/i, "emailTaken"],
  [/email logins are disabled|email signups are disabled/i, "emailProviderDisabled"],
];

export interface AuthErrorInfo extends SafeAuthError {
  key: AuthErrorKey;
}

function keyFor(e: SafeAuthError): AuthErrorKey {
  const byCode = e.code ? BY_CODE[e.code] : undefined;
  if (byCode) return byCode;
  const byMessage = BY_MESSAGE.find(([re]) => e.message && re.test(e.message));
  if (byMessage) return byMessage[1];
  if (e.name === "AuthRetryableFetchError" && (e.status === 0 || e.status === undefined))
    return "network";
  if (e.status === 0) return "network";
  if (e.status !== undefined && e.status >= 500) return "serverUnavailable";
  if (typeof navigator !== "undefined" && !navigator.onLine) return "network";
  return "generic";
}

/** Classify an error and keep Supabase's safe details (code, status, message) for display. */
export function describeAuthError(err: unknown): AuthErrorInfo {
  const safe = safeAuthError(err);
  return { ...safe, key: keyFor(safe) };
}

/** describeAuthError + a safe console line (no passwords, tokens or keys). Use in catch blocks. */
export function handleAuthError(context: string, err: unknown): AuthErrorInfo {
  logAuthError(context, err);
  return describeAuthError(err);
}

/** Message key only (kept for callers that don't show details). */
export function authErrorKey(err: unknown): AuthErrorKey {
  return describeAuthError(err).key;
}

/** An error Supabase put on an auth redirect (expired or already-used email link). */
export function readAuthLinkError(url: string = window.location.href): AuthErrorKey | null {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  parsed.searchParams.forEach((value, key) => params.set(key, value));
  if (!params.has("error") && !params.has("error_code")) return null;
  const code = params.get("error_code") ?? "";
  return BY_CODE[code] ?? "linkExpired";
}
