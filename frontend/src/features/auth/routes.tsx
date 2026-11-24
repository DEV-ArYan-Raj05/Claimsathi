import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { GuestOnly } from "./components/GuestOnly";
import { RequireAuth } from "./components/RequireAuth";

const S02LoginPage = lazy(() =>
  import("./pages/S02LoginPage").then((m) => ({ default: m.S02LoginPage })),
);
const S02SignUpPage = lazy(() =>
  import("./pages/S02SignUpPage").then((m) => ({ default: m.S02SignUpPage })),
);
const S02ForgotPasswordPage = lazy(() =>
  import("./pages/S02ForgotPasswordPage").then((m) => ({ default: m.S02ForgotPasswordPage })),
);
const S02ResetPasswordPage = lazy(() =>
  import("./pages/S02ResetPasswordPage").then((m) => ({ default: m.S02ResetPasswordPage })),
);
const S03OnboardingPage = lazy(() =>
  import("./pages/S03OnboardingPage").then((m) => ({ default: m.S03OnboardingPage })),
);
const AuthCallbackPage = lazy(() =>
  import("./pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })),
);

/**
 * /signup, /forgot-password and /reset-password are S-02 sub-screens for email + password sign-in.
 * TODO(PRD §4.1, rules.md §7): add them to the route contract list.
 */
export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <GuestOnly>
        <S02LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: "/signup",
    element: (
      <GuestOnly>
        <S02SignUpPage />
      </GuestOnly>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <GuestOnly>
        <S02ForgotPasswordPage />
      </GuestOnly>
    ),
  },
  { path: "/reset-password", element: <S02ResetPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  {
    path: "/onboarding",
    element: (
      <RequireAuth allowUnonboarded>
        <S03OnboardingPage />
      </RequireAuth>
    ),
  },
];
