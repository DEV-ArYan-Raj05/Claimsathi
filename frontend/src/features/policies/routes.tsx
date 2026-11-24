import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X02 = lazy(() =>
  import("./pages/X02PolicyDirectoryPage").then((m) => ({ default: m.X02PolicyDirectoryPage })),
);
const X03 = lazy(() =>
  import("./pages/X03AddPolicyPage").then((m) => ({ default: m.X03AddPolicyPage })),
);
const X04 = lazy(() =>
  import("./pages/X04PolicyDetailPage").then((m) => ({ default: m.X04PolicyDetailPage })),
);

export const policiesRoutes: RouteObject[] = [
  { path: "policies", element: <X02 /> },
  { path: "policies/new", element: <X03 /> },
  { path: "policies/:id", element: <X04 /> },
];
