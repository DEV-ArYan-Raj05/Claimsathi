import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const S01LandingPage = lazy(() =>
  import("./pages/S01LandingPage").then((m) => ({ default: m.S01LandingPage })),
);

export const landingRoutes: RouteObject[] = [{ path: "/", element: <S01LandingPage /> }];
