import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { MOCK_INSURER_ENABLED } from "@/shared/config/app";

const MockInsurerPage = lazy(() =>
  import("./pages/MockInsurerPage").then((m) => ({ default: m.MockInsurerPage })),
);

/** Only mounted in demo mode or with VITE_ENABLE_MOCK_INSURER=true. */
export const mockInsurerRoutes: RouteObject[] = MOCK_INSURER_ENABLED
  ? [{ path: "/admin/mock-insurer", element: <MockInsurerPage /> }]
  : [];
