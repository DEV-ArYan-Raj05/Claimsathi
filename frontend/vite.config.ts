import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { isPrivilegedKey, supabaseKeyKind } from "./src/shared/config/supabaseKey";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Serves the team's architecture diagram (../internal/architecture/index.html, a single
 * self-contained file) at /architecture/ in dev and copies it into the build. It keeps its
 * noindex + INTERNAL banner and nothing in the app links to it. Set VITE_INCLUDE_ARCHITECTURE=false
 * to leave it out of a build.
 */
function architecturePage(): Plugin {
  const source = path.resolve(root, "../internal/architecture/index.html");
  const include = process.env.VITE_INCLUDE_ARCHITECTURE !== "false";
  return {
    name: "claimsathi-architecture-page",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (url !== "/architecture" && url !== "/architecture/") return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(source));
      });
    },
    closeBundle() {
      if (!include || !fs.existsSync(source)) return;
      const out = path.resolve(root, "dist/architecture");
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(source, path.join(out, "index.html"));
    },
  };
}

/**
 * Reports which Supabase settings Vite loaded from frontend/.env* (names and key type only, never
 * the values), and refuses to start or build with a secret / service_role key in a VITE_ variable:
 * every VITE_ value is copied into the JavaScript sent to browsers (rules.md §10).
 */
function supabaseEnvCheck(mode: string): Plugin {
  const env = loadEnv(mode, root, "VITE_");
  const url = env.VITE_SUPABASE_URL ?? "";
  const keyName = env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? "VITE_SUPABASE_PUBLISHABLE_KEY"
    : "VITE_SUPABASE_ANON_KEY";
  const kind = supabaseKeyKind(env[keyName] ?? "");
  return {
    name: "claimsathi-supabase-env-check",
    configResolved(config) {
      if (mode === "test") return;
      if (isPrivilegedKey(kind)) {
        throw new Error(
          `${keyName} holds a Supabase ${kind === "secret" ? "secret (sb_secret_…)" : "service_role"} key. ` +
            "Browsers must only get the publishable key (sb_publishable_…): Supabase rejects secret keys " +
            "from browsers with HTTP 401, and bundling one leaks full database access. Replace it in " +
            "frontend/.env.local and rotate the leaked key in Supabase → Project Settings → API Keys.",
        );
      }
      let host = "not set";
      try {
        if (url) host = new URL(url).host;
      } catch {
        host = "INVALID (expected https://<ref>.supabase.co)";
      }
      const label = url && kind !== "missing" ? "Supabase Auth" : "demo accounts";
      config.logger.info(`[claimsathi] auth: ${label} · URL ${host} · ${keyName}: ${kind}`);
      const chatUrl = env.VITE_API_BASE_URL || env.VITE_CHAT_API_BASE_URL || "";
      const chat = chatUrl
        ? label === "Supabase Auth"
          ? `live via ${chatUrl === "/" ? "same origin " : chatUrl}/api/v1/chat`
          : `OFF (${chatUrl} set, but the live assistant also needs Supabase Auth)`
        : "demo replies (set VITE_CHAT_API_BASE_URL for the live assistant)";
      config.logger.info(`[claimsathi] assistant: ${chat}`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), architecturePage(), supabaseEnvCheck(mode)],
  resolve: { alias: { "@": path.resolve(root, "src") } },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test-setup.ts"],
  },
}));
