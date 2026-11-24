/**
 * The only place that talks HTTP. Features call this through their own api.ts (rules.md §7).
 * With no VITE_API_BASE_URL the request is answered by the in-browser demo server instead.
 */
import { API_BASE_URL, CHAT_API_BASE_URL, IS_DEMO } from "../config/app";
import type { ApiErrorBody } from "../api/contract";
import { expireSession, getAccessToken } from "./session";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null && "error" in value;
}

interface HttpOptions {
  baseUrl: string;
  /** Sign the user out on 401 (the main API). The assistant reports it instead. */
  expireOn401: boolean;
}

async function http<T>(opts: HttpOptions, method: HttpMethod, path: string, body?: unknown) {
  // A relative base such as "/" means this site's own origin (Vercel: same deployment).
  const url = new URL(`/api/v1${path}`, new URL(opts.baseUrl, window.location.origin));
  const token = await getAccessToken();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // Expired or revoked token: sign out locally so the route guards send the user to S-02.
    if (res.status === 401 && opts.expireOn401) await expireSession();
    const err = isErrorBody(data) ? data.error : { code: "HTTP_ERROR", message: res.statusText };
    throw new ApiError(err.code, err.message, res.status);
  }
  return data as T;
}

/** Call /api/v1{path}. */
export async function api<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!navigator.onLine) throw new ApiError("OFFLINE", "offline", 0);
  if (IS_DEMO) {
    const { handleDemoRequest } = await import("./demo/server");
    return handleDemoRequest(method, path, body) as Promise<T>;
  }
  return http<T>({ baseUrl: API_BASE_URL, expireOn401: true }, method, path, body);
}

/**
 * Always the real FastAPI at CHAT_API_BASE_URL, even while other screens use demo data.
 * A 401 here is reported to the user, not turned into a sign-out: with a working Supabase
 * session it usually means the backend's SUPABASE_URL is wrong.
 */
export async function liveApi<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!navigator.onLine) throw new ApiError("OFFLINE", "offline", 0);
  return http<T>({ baseUrl: CHAT_API_BASE_URL, expireOn401: false }, method, path, body);
}
