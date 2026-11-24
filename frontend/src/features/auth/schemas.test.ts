import { describe, expect, it } from "vitest";
import { resetPasswordSchema, signInSchema, signUpSchema } from "./schemas";

const ok = {
  fullName: "Sunita Devi",
  email: " Sunita@Example.in ",
  password: "Health123",
  confirmPassword: "Health123",
};

function firstError(result: {
  success: boolean;
  error?: { issues: { message: string; path: PropertyKey[] }[] };
}) {
  const issue = result.error?.issues[0];
  return issue ? `${String(issue.path[0])}:${issue.message}` : null;
}

describe("signUpSchema", () => {
  it("accepts a valid form and normalises the email", () => {
    const result = signUpSchema.safeParse(ok);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("sunita@example.in");
  });

  it.each([
    [{ password: "short1", confirmPassword: "short1" }, "password:passwordShort"],
    [{ password: "onlyletters", confirmPassword: "onlyletters" }, "password:passwordWeak"],
    [{ password: "12345678", confirmPassword: "12345678" }, "password:passwordWeak"],
    [{ confirmPassword: "Health124" }, "confirmPassword:passwordMismatch"],
    [{ email: "not-an-email" }, "email:emailInvalid"],
    [{ fullName: "A" }, "fullName:nameShort"],
  ])("rejects %j", (patch, expected) => {
    expect(firstError(signUpSchema.safeParse({ ...ok, ...patch }))).toBe(expected);
  });
});

describe("signInSchema", () => {
  it("needs both fields", () => {
    expect(firstError(signInSchema.safeParse({ email: "", password: "x" }))).toBe(
      "email:emailRequired",
    );
    expect(firstError(signInSchema.safeParse({ email: "a@b.in", password: "" }))).toBe(
      "password:passwordRequired",
    );
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching strong passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "NewPass123", confirmPassword: "NewPass123" })
        .success,
    ).toBe(true);
    expect(
      firstError(resetPasswordSchema.safeParse({ password: "NewPass123", confirmPassword: "x" })),
    ).toBe("confirmPassword:passwordMismatch");
  });
});
