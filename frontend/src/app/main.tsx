import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@/shared/i18n";
import { initSession } from "@/shared/lib/session";
import { Providers } from "./providers";
import { router } from "./router";
import "./index.css";

void initSession();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}
