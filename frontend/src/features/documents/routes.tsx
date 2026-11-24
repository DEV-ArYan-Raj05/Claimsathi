import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X06 = lazy(() =>
  import("./pages/X06DocumentsPage").then((m) => ({ default: m.X06DocumentsPage })),
);

export const documentsRoutes: RouteObject[] = [{ path: "claims/:id/documents", element: <X06 /> }];
