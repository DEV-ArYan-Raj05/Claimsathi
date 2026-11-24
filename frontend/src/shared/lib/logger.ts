/**
 * The only place the frontend writes to the console (rules.md §5: no stray console.log).
 * Auth errors are logged with safe fields only: name, code, status, message. Never the request,
 * headers, tokens, keys or passwords — and email addresses are masked out of messages (rules.md §10).
 */
const EMAIL_RE = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g;

export interface SafeAuthError {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
}

function pick(err: unknown, key: string): unknown {
  return typeof err === "object" && err !== null && key in err
    ? (err as Record<string, unknown>)[key]
    : undefined;
}

/** Reduce any thrown value to the fields that are safe to show or log. */
export function safeAuthError(err: unknown): SafeAuthError {
  const name = pick(err, "name");
  const code = pick(err, "code");
  const status = pick(err, "status");
  const message = pick(err, "message") ?? (typeof err === "string" ? err : undefined);
  return {
    name: typeof name === "string" ? name : undefined,
    code: typeof code === "string" ? code : undefined,
    status: typeof status === "number" ? status : undefined,
    message:
      typeof message === "string" ? message.replace(EMAIL_RE, "[email]").slice(0, 300) : undefined,
  };
}

/** e.g. logAuthError("signIn", err) → console.warn("[auth] signIn failed", { name, code, … }). */
export function logAuthError(context: string, err: unknown): void {
  console.warn(`[auth] ${context} failed`, safeAuthError(err));
}
