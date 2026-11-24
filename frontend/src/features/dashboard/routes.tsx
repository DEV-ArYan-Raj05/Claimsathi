import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X01TrackHomePage = lazy(() =>
  import("./pages/X01TrackHomePage").then((m) => ({ default: m.X01TrackHomePage })),
);

/** Mounted under /:track by the app router. */
export const dashboardRoutes: RouteObject[] = [{ index: true, element: <X01TrackHomePage /> }];
