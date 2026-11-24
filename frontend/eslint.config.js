import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "public", "src/shared/api/schema.d.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
    },
  },
  {
    // The logger is the one place allowed to write to the console (safe fields only).
    files: ["src/shared/lib/logger.ts"],
    rules: { "no-console": "off" },
  },
  {
    // routes.tsx files export route objects that wrap lazy pages; Fast Refresh (dev-only HMR)
    // can't hot-swap them, which is expected and harmless.
    files: ["**/routes.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
);
