import { createBrowserRouter, Navigate } from "react-router-dom";
import { authRoutes, RequireAuth } from "@/features/auth";
import { claimPackRoutes } from "@/features/claim-pack";
import { claimsRoutes } from "@/features/claims";
import { dashboardRoutes } from "@/features/dashboard";
import { documentsRoutes } from "@/features/documents";
import { landingRoutes } from "@/features/landing";
import { mockInsurerRoutes } from "@/features/mock-insurer";
import { policiesRoutes } from "@/features/policies";
import { settingsRoutes } from "@/features/settings";
import { trackerRoutes } from "@/features/tracker";
import { AppShell } from "./AppShell";
import { RootLayout, TrackGate } from "./layouts";

/**
 * Routes are contracts (rules.md §7): /, /login, /onboarding, /auth/callback, /{track}/…, /settings,
 * plus the email sign-in screens /signup, /forgot-password, /reset-password (features/auth/routes).
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...landingRoutes,
      ...authRoutes,
      ...mockInsurerRoutes,
      {
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        children: [
          ...settingsRoutes,
          {
            path: ":track",
            element: <TrackGate />,
            children: [
              ...dashboardRoutes,
              ...policiesRoutes,
              ...claimsRoutes,
              ...documentsRoutes,
              ...claimPackRoutes,
              ...trackerRoutes,
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
