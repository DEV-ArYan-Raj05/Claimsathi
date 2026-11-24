/** Session store with real Supabase Auth on (mocked client): restore, events, expiry, sign-out. */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/app", () => ({
  IS_DEMO: true,
  IS_DEMO_AUTH: false,
  HAS_SUPABASE: true,
  IS_SUPABASE_KEY_PRIVILEGED: false,
}));
vi.mock("./logger", () => ({ logAuthError: vi.fn() }));

const demoDb = vi.hoisted(() => ({ setDemoAccount: vi.fn(), deleteDemoDb: vi.fn() }));
vi.mock("./demo/db", () => demoDb);

type Listener = (event: AuthChangeEvent, session: Session | null) => void;
const fake = vi.hoisted(() => ({
  stored: null as unknown,
  getSessionError: null as unknown,
  listeners: [] as unknown[],
}));
const emit = (event: AuthChangeEvent, session: Session | null) =>
  (fake.listeners as Listener[]).forEach((cb) => cb(event, session));
const client = {
  auth: {
    onAuthStateChange: vi.fn((cb: Listener) => {
      fake.listeners.push(cb);
      return { data: { subscription: { unsubscribe: () => undefined } } };
    }),
    getSession: vi.fn(() =>
      Promise.resolve({ data: { session: fake.stored }, error: fake.getSessionError }),
    ),
    signOut: vi.fn(() => {
      fake.stored = null;
      emit("SIGNED_OUT", null);
      return Promise.resolve({ error: null });
    }),
  },
};
vi.mock("./supabase", () => ({ getSupabase: () => Promise.resolve(client) }));

const session = (id: string) =>
  ({ access_token: `t-${id}`, user: { id, email: `${id}@x.in` } }) as unknown as Session;
const flush = () => new Promise((r) => setTimeout(r, 0));

async function load() {
  vi.resetModules();
  const mod = await import("./session");
  const { queryClient } = await import("./queryClient");
  return { ...mod, queryClient };
}

beforeEach(() => {
  fake.stored = null;
  fake.getSessionError = null;
  fake.listeners = [];
  vi.clearAllMocks();
});

describe("session (Supabase Auth)", () => {
  it("waits in 'loading', then restores the stored session (survives a refresh)", async () => {
    fake.stored = session("a");
    const { initSession, useSession } = await load();
    expect(useSession.getState()).toMatchObject({ status: "loading", isReady: false });
    await initSession();
    expect(useSession.getState()).toMatchObject({
      status: "signedIn",
      isReady: true,
      user: { id: "a", email: "a@x.in" },
    });
    expect(demoDb.setDemoAccount).toHaveBeenCalledWith("sb_a");
  });

  it("registers exactly one auth listener however often it's started", async () => {
    const { initSession } = await load();
    await Promise.all([initSession(), initSession()]);
    await initSession();
    expect(client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("signs out with 'expired' when Supabase ends the session on its own", async () => {
    fake.stored = session("a");
    const { initSession, useSession } = await load();
    await initSession();
    emit("SIGNED_OUT", null);
    await flush();
    expect(useSession.getState()).toMatchObject({ status: "signedOut", signOutReason: "expired" });
  });

  it("signOut ends the session on this device and clears the user's data", async () => {
    fake.stored = session("a");
    const { initSession, signOut, useSession, queryClient } = await load();
    await initSession();
    queryClient.setQueryData(["me"], { name: "A" });
    await expect(signOut()).resolves.toBe(true);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(useSession.getState()).toMatchObject({
      status: "signedOut",
      user: null,
      signOutReason: null,
    });
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
    expect(demoDb.deleteDemoDb).toHaveBeenCalledWith("sb_a");
  });

  it("clears cached data when a different user signs in", async () => {
    fake.stored = session("a");
    const { initSession, useSession, queryClient } = await load();
    await initSession();
    queryClient.setQueryData(["me"], { name: "A" });
    emit("SIGNED_IN", session("b"));
    await flush();
    expect(useSession.getState().user?.id).toBe("b");
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
  });

  it("flags a password-recovery session", async () => {
    const { initSession, useSession } = await load();
    await initSession();
    emit("PASSWORD_RECOVERY", session("a"));
    await flush();
    expect(useSession.getState()).toMatchObject({ isSignedIn: true, isRecovery: true });
  });

  it("treats a failed restore as signed out, with a reason", async () => {
    fake.getSessionError = new Error("offline");
    const { initSession, useSession } = await load();
    await initSession();
    expect(useSession.getState()).toMatchObject({
      status: "signedOut",
      isReady: true,
      signOutReason: "restoreFailed",
    });
  });
});
