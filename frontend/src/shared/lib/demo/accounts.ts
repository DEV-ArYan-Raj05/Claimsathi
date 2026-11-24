/**
 * Demo accounts (demo mode only — VITE_API_BASE_URL empty). These are test logins for the in-browser
 * demo server, not real credentials: nothing leaves the browser. Each account gets its own demo
 * database in localStorage, so judges can switch between people without their data mixing.
 */
import type { Profile } from "../../api/contract";
import type { Track } from "../../config/app";

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  /** Overrides on the seeded profile. */
  profile: Partial<Profile>;
  /** Where to land after sign-in. */
  home: string;
}

const onboarded = (name: string, state: string, district: string, tracks: Track[]) => ({
  name,
  state,
  district,
  tracks,
  last_track: tracks[0],
  is_onboarded: true,
});

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "sunita",
    email: "sunita@demo.claimsathi.in",
    password: "Health@123",
    profile: onboarded("Sunita Devi", "Haryana", "Rohtak", ["health"]),
    home: "/health",
  },
  {
    id: "ramesh",
    email: "ramesh@demo.claimsathi.in",
    password: "Crop@123",
    profile: onboarded("Ramesh Kumar", "Haryana", "Rohtak", ["crop"]),
    home: "/crop",
  },
  {
    id: "judge",
    email: "judge@demo.claimsathi.in",
    password: "Judge@123",
    profile: onboarded("Demo Judge", "Delhi", "New Delhi", ["health", "crop"]),
    home: "/health",
  },
  {
    id: "new",
    email: "new@demo.claimsathi.in",
    password: "Welcome@123",
    profile: {},
    home: "/onboarding",
  },
];

/** Google / WhatsApp sign-in in demo mode lands on the fresh, not-yet-onboarded account. */
export const DEFAULT_DEMO_ACCOUNT = "new";

export function findDemoAccount(email: string, password: string): DemoAccount | null {
  const e = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email === e && a.password === password) ?? null;
}

export function demoAccountById(id: string | null): DemoAccount {
  return (
    DEMO_ACCOUNTS.find((a) => a.id === id) ??
    (DEMO_ACCOUNTS.find((a) => a.id === DEFAULT_DEMO_ACCOUNT) as DemoAccount)
  );
}
