import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X05 = lazy(() =>
  import("./pages/X05NewClaimPage").then((m) => ({ default: m.X05NewClaimPage })),
);
const X08 = lazy(() =>
  import("./pages/X08MyClaimsPage").then((m) => ({ default: m.X08MyClaimsPage })),
);

export const claimsRoutes: RouteObject[] = [
  { path: "claims", element: <X08 /> },
  { path: "claims/new", element: <X05 /> },
];
