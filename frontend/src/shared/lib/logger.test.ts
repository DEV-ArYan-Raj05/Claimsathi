import { afterEach, describe, expect, it, vi } from "vitest";
import { logAuthError } from "./logger";

afterEach(() => vi.restoreAllMocks());

describe("logAuthError", () => {
  it("logs only name, code, status and message — never tokens, keys or passwords", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const err = Object.assign(new Error("Invalid login credentials"), {
      name: "AuthApiError",
      status: 400,
      code: "invalid_credentials",
      password: "Health123",
      access_token: "eyJsecret",
      headers: { apikey: "sb_publishable_x", Authorization: "Bearer eyJsecret" },
    });
    logAuthError("signIn", err);
    expect(warn).toHaveBeenCalledWith("[auth] signIn failed", {
      name: "AuthApiError",
      code: "invalid_credentials",
      status: 400,
      message: "Invalid login credentials",
    });
    const logged = JSON.stringify(warn.mock.calls);
    for (const secret of ["Health123", "eyJsecret", "sb_publishable_x", "Bearer"]) {
      expect(logged).not.toContain(secret);
    }
  });
});
