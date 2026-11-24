import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X07 = lazy(() =>
  import("./pages/X07ClaimPackPage").then((m) => ({ default: m.X07ClaimPackPage })),
);

export const claimPackRoutes: RouteObject[] = [{ path: "claims/:id/pack", element: <X07 /> }];
