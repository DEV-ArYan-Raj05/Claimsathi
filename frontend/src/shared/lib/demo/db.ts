/** In-browser demo database, persisted to localStorage so a page reload keeps the story. */
import { readStorage, removeStorage, writeStorage } from "../storage";
import { demoAccountById } from "./accounts";
import { CROP_CLAIMS, CROP_DOCUMENTS, CROP_POLICIES, CROP_STAGES } from "./fixturesCrop";
import { HEALTH_CLAIMS, HEALTH_DOCUMENTS, HEALTH_POLICIES, HEALTH_STAGES } from "./fixturesHealth";
import type { DemoDb } from "./types";
import { relDate } from "./types";

const KEY_PREFIX = "cs.demo.db";
const ACCOUNT_KEY = "cs.demo.account";
const VERSION = 3;

let cache: DemoDb | null = null;

/**
 * Which demo account is signed in; each one has its own database. With real Supabase Auth the id is
 * the signed-in user's (sb_<uuid>), seeded like the "new" demo account.
 */
export function currentDemoAccount(): string {
  return readStorage(ACCOUNT_KEY) || demoAccountById(null).id;
}

export function setDemoAccount(id: string): void {
  writeStorage(ACCOUNT_KEY, id);
  cache = null;
}

const dbKey = () => `${KEY_PREFIX}.${currentDemoAccount()}`;

function seed(): DemoDb {
  const account = demoAccountById(currentDemoAccount());
  const db: DemoDb = {
    version: VERSION,
    profile: {
      id: "usr_demo",
      name: "",
      email: "demo@claimsathi.example.in",
      language: "en",
      state: "",
      district: "",
      last_track: "health",
      tracks: ["health", "crop"],
      call_consent: false,
      whatsapp_phone: null,
      whatsapp_verified_at: null,
      whatsapp_opt_in: false,
      bank_last4: "4417",
      is_onboarded: false,
    },
    members: [
      { id: "mem_1", name: "Sunita Devi", relation: "self", dob: "1991-02-14" },
      { id: "mem_2", name: "Raju Kumar", relation: "son", dob: relDate(-12 * 365) },
    ],
    parcels: [
      { id: "lp_1", survey_no: "112/4", village: "Sampla", district: "Rohtak", area_ha: "1.60" },
      { id: "lp_2", survey_no: "87/2", village: "Sampla", district: "Rohtak", area_ha: "1.20" },
    ],
    policies: [...HEALTH_POLICIES, ...CROP_POLICIES],
    claims: [...HEALTH_CLAIMS, ...CROP_CLAIMS],
    documents: [...HEALTH_DOCUMENTS, ...CROP_DOCUMENTS],
    stages: [...HEALTH_STAGES, ...CROP_STAGES],
    jobs: [],
  };
  Object.assign(db.profile, { email: account.email }, account.profile);
  return db;
}

export function db(): DemoDb {
  if (cache) return cache;
  const raw = readStorage(dbKey());
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed.version === VERSION) cache = parsed;
    } catch {
      cache = null;
    }
  }
  cache ??= seed();
  return cache;
}

export function save(): void {
  if (cache) writeStorage(dbKey(), JSON.stringify(cache));
}

/** Remove one account's demo database from this browser (sign-out on a shared device). */
export function deleteDemoDb(accountId: string): void {
  removeStorage(`${KEY_PREFIX}.${accountId}`);
  if (currentDemoAccount() === accountId) cache = null;
}

/** "Delete my data" in demo mode: back to the seeded story. */
export function resetDb(): void {
  cache = seed();
  save();
}

let counter = Date.now() % 100000;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36)}`;
}
