import { describe, expect, it } from "vitest";
import { isPrivilegedKey, supabaseKeyKind } from "./supabaseKey";

const jwt = (role: string) =>
  `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.sig`;

describe("supabaseKeyKind", () => {
  it.each([
    ["sb_publishable_abc123", "publishable", false],
    ["sb_secret_abc123", "secret", true],
    [jwt("anon"), "anon", false],
    [jwt("service_role"), "serviceRole", true],
    ["", "missing", false],
    ["something-else", "unknown", false],
  ])("%s → %s", (key, kind, privileged) => {
    expect(supabaseKeyKind(key)).toBe(kind);
    expect(isPrivilegedKey(supabaseKeyKind(key))).toBe(privileged);
  });
});
