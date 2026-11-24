/** Only same-app paths from router state; never "//host" or absolute URLs (no open redirects). */
export function safeFrom(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : null;
}
