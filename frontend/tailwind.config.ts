import type { Config } from "tailwindcss";

/** Every colour maps to a CSS variable from src/shared/theme/tokens.css (rules.md §7). */
const token = (name: string) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      dominant: token("dominant"),
      secondary: token("secondary"),
      accent: token("accent"),
      ink: token("ink"),
      "on-dominant": token("on-dominant"),
      muted: token("muted"),
      success: token("success"),
      "on-accent": token("on-accent"),
    },
    fontFamily: { sans: ["Mukta", "Noto Sans Devanagari", "system-ui", "sans-serif"] },
    extend: {
      maxWidth: { shell: "1200px" },
      minHeight: { tap: "48px" },
      minWidth: { tap: "48px" },
      transitionDuration: { track: "400ms" },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
