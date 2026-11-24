/** Internal shapes of the in-browser demo database. */
import type {
  BillSummary,
  Claim,
  ClaimDocument,
  Job,
  LandParcel,
  Member,
  Policy,
  Profile,
  Stage,
} from "../../api/contract";

export type DemoClaim = Omit<
  Claim,
  "readiness_score" | "is_overdue" | "expected_settlement_date" | "intimation_due_at"
>;

export interface DemoDocument extends ClaimDocument {
  claim_id: string;
  uploaded_at: string;
  bill: BillSummary | null;
  replaces: string | null;
}

export interface DemoStage extends Stage {
  claim_id: string;
}

export interface DemoJob extends Job {
  created_at: number;
  duration_ms: number;
}

export interface DemoDb {
  version: number;
  profile: Profile;
  members: Member[];
  parcels: LandParcel[];
  policies: Policy[];
  claims: DemoClaim[];
  documents: DemoDocument[];
  stages: DemoStage[];
  jobs: DemoJob[];
}

/** ISO timestamp `hours` from now (negative = past). Keeps demo deadlines live. */
export function rel(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

/** ISO date (yyyy-mm-dd) `days` from now. */
export function relDate(days: number): string {
  return rel(days * 24).slice(0, 10);
}
