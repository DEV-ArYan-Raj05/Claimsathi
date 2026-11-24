import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const X11 = lazy(() =>
  import("./pages/X11SettingsPage").then((m) => ({ default: m.X11SettingsPage })),
);

export const settingsRoutes: RouteObject[] = [{ path: "/settings", element: <X11 /> }];
