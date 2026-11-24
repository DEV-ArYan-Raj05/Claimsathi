/** Route guards: no protected content before the session is known, and no redirect loops. */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import "@/shared/i18n";
import { useSession } from "@/shared/lib/session";
import { GuestOnly } from "./GuestOnly";
import { PasswordInput } from "./PasswordInput";
import { RequireAuth } from "./RequireAuth";

const profile = vi.hoisted(() => ({
  isPending: false,
  data: { is_onboarded: true, last_track: "crop" } as
    { is_onboarded: boolean; last_track: string } | undefined,
}));
vi.mock("../hooks/useProfile", () => ({
  useProfile: () => profile,
  useHomePath: () =>
    profile.isPending
      ? null
      : profile.data?.is_onboarded
        ? `/${profile.data.last_track}`
        : "/onboarding",
}));

afterEach(cleanup);
beforeEach(() => {
  profile.isPending = false;
  profile.data = { is_onboarded: true, last_track: "crop" };
});

function Where() {
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "";
  return <p data-testid="where">{`${loc.pathname}|${from}`}</p>;
}

function app(start: string | { pathname: string; state: unknown }) {
  return render(
    <MemoryRouter initialEntries={[start]}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <p>login form</p>
              <Where />
            </GuestOnly>
          }
        />
        <Route
          path="/crop/claims"
          element={
            <RequireAuth>
              <p>my claims</p>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

const setSession = (isReady: boolean, isSignedIn: boolean, isRecovery = false) =>
  useSession.setState({
    isReady,
    isSignedIn,
    isRecovery,
    status: isSignedIn ? "signedIn" : "signedOut",
  });

describe("RequireAuth", () => {
  it("shows nothing protected while the session is still loading", () => {
    setSession(false, false);
    app("/crop/claims");
    expect(screen.queryByText("my claims")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("sends signed-out users to /login and remembers where they were going", () => {
    setSession(true, false);
    app("/crop/claims?x=1");
    expect(screen.getByTestId("where").textContent).toBe("/login|/crop/claims?x=1");
  });

  it("shows the page to signed-in, onboarded users", () => {
    setSession(true, true);
    app("/crop/claims");
    expect(screen.getByText("my claims")).toBeTruthy();
  });
});

describe("GuestOnly", () => {
  it("shows the sign-in screen to signed-out users", () => {
    setSession(true, false);
    app("/login");
    expect(screen.getByText("login form")).toBeTruthy();
  });

  it("moves signed-in users to where they were going", () => {
    setSession(true, true);
    app({ pathname: "/login", state: { from: "/crop/policies" } });
    expect(screen.getByTestId("where").textContent).toBe("/crop/policies|");
  });

  it("ignores unsafe 'from' values and uses the user's home", () => {
    setSession(true, true);
    app({ pathname: "/login", state: { from: "//evil.example" } });
    expect(screen.getByTestId("where").textContent).toBe("/crop|");
  });

  it("sends new users to onboarding and recovery sessions to the reset form", () => {
    setSession(true, true);
    profile.data = { is_onboarded: false, last_track: "health" };
    app("/login");
    expect(screen.getByTestId("where").textContent).toBe("/onboarding|");
    cleanup();
    setSession(true, true, true);
    app("/login");
    expect(screen.getByTestId("where").textContent).toBe("/reset-password|");
  });
});

describe("PasswordInput", () => {
  it("toggles between hidden and visible", () => {
    render(<PasswordInput id="pw" defaultValue="secret1A" />);
    const input = document.getElementById("pw") as HTMLInputElement;
    expect(input.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});
