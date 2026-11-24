import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X09 = lazy(() =>
  import("./pages/X09ClaimTrackerPage").then((m) => ({ default: m.X09ClaimTrackerPage })),
);

export const trackerRoutes: RouteObject[] = [{ path: "claims/:id", element: <X09 /> }];
