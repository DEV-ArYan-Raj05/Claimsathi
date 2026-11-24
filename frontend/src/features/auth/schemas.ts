import { z } from "zod";

/** S-03 onboarding form — mirrors PATCH /me in backend/app/features/profile/schemas.py. */
export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(60),
    district: z.string().trim().min(2).max(60),
    health: z.boolean(),
    crop: z.boolean(),
    storage_consent: z.literal(true),
    call_consent: z.boolean(),
    whatsapp_opt_in: z.boolean(),
  })
  .refine((v) => v.health || v.crop, { path: ["crop"], message: "pickTrack" });

export type OnboardingForm = z.infer<typeof onboardingSchema>;

/**
 * Email + password forms (S-02). Error messages are i18n keys under auth.fieldErrors.*.
 * Passwords: 8–72 characters (72 is bcrypt's limit) with a letter and a number. Set the same
 * minimum in Supabase → Auth → Providers → Email so the server enforces it too.
 */
const email = z.string().trim().toLowerCase().min(1, "emailRequired").email("emailInvalid");
const newPassword = z
  .string()
  .min(8, "passwordShort")
  .max(72, "passwordLong")
  .regex(/[A-Za-z]/, "passwordWeak")
  .regex(/\d/, "passwordWeak");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired"),
});
export type SignInForm = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "nameShort").max(80, "nameLong"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
export type SignUpForm = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
