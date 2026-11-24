import { describe, expect, it } from "vitest";
import { authErrorKey, describeAuthError, readAuthLinkError } from "./authErrors";

describe("authErrorKey", () => {
  it.each([
    [{ code: "invalid_credentials", status: 400 }, "invalidCredentials"],
    [{ code: "email_not_confirmed" }, "emailNotConfirmed"],
    [{ code: "user_already_exists" }, "emailTaken"],
    [{ code: "weak_password" }, "weakPassword"],
    [{ code: "over_email_send_rate_limit" }, "rateLimited"],
    [{ code: "same_password" }, "samePassword"],
    [{ name: "AuthRetryableFetchError", status: 0 }, "network"],
    [{ message: "Invalid login credentials" }, "invalidCredentials"],
    [{ message: "User already registered" }, "emailTaken"],
    [new Error("SUPABASE_NOT_CONFIGURED"), "notConfigured"],
    [{ code: "something_new" }, "generic"],
    ["boom", "generic"],
  ])("%j → %s", (err, key) => {
    expect(authErrorKey(err)).toBe(key);
  });
});

describe("readAuthLinkError", () => {
  it("reads Supabase errors from the hash or the query", () => {
    expect(
      readAuthLinkError(
        "https://app.test/auth/callback#error=access_denied&error_code=otp_expired",
      ),
    ).toBe("linkExpired");
    expect(readAuthLinkError("https://app.test/auth/callback?error=access_denied")).toBe(
      "linkExpired",
    );
  });

  it("is null for a normal link", () => {
    expect(readAuthLinkError("https://app.test/auth/callback#access_token=x&type=signup")).toBe(
      null,
    );
  });
});

describe("describeAuthError keeps Supabase's details", () => {
  it.each([
    [{ code: "email_provider_disabled", status: 422 }, "emailProviderDisabled"],
    [{ code: "email_address_not_authorized", status: 400 }, "emailNotAuthorized"],
    [{ code: "signup_disabled", status: 422 }, "signupDisabled"],
    [{ code: "weak_password", status: 422, name: "AuthWeakPasswordError" }, "weakPassword"],
    [
      { status: 401, name: "AuthApiError", message: "Forbidden use of secret API key in browser" },
      "secretKeyInBrowser",
    ],
    [new Error("SUPABASE_SECRET_KEY_IN_BROWSER"), "secretKeyInBrowser"],
    [{ status: 401, name: "AuthApiError", message: "Invalid API key" }, "invalidApiKey"],
    [
      { status: 500, code: "unexpected_failure", message: "Database error saving new user" },
      "signupDatabaseError",
    ],
    [
      { status: 503, name: "AuthRetryableFetchError", message: "Service Unavailable" },
      "serverUnavailable",
    ],
  ])("%j → %s", (err, key) => {
    expect(describeAuthError(err).key).toBe(key);
  });

  it("returns code, status and message instead of hiding them", () => {
    const info = describeAuthError({
      name: "AuthApiError",
      status: 400,
      code: "some_new_code",
      message: "Something specific happened",
    });
    expect(info).toEqual({
      key: "generic",
      name: "AuthApiError",
      status: 400,
      code: "some_new_code",
      message: "Something specific happened",
    });
  });

  it("masks email addresses in messages", () => {
    expect(describeAuthError({ message: 'Email address "ravi@x.in" is invalid' }).message).toBe(
      'Email address "[email]" is invalid',
    );
  });
});
