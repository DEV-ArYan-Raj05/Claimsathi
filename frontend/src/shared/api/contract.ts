/**
 * API contract types mirroring PRD §6 (Pydantic models in backend/app/features/<feature>/schemas.py).
 * TODO(PRD §5.1): replace with `openapi-typescript` output in schema.d.ts once the API is live.
 * Money travels as decimal strings ("12345.00"); dates as ISO-8601 UTC strings.
 */
import type { Language, Track } from "../config/app";

export interface Bilingual {
  en: string;
  hi: string;
}

export type Money = string;
export type Severity = "critical" | "high" | "medium";
export type ScoreBand = "ready" | "fix" | "high_risk";
export type ClauseType =
  "coverage" | "exclusion" | "waiting_period" | "limit" | "procedure" | "fine_print";
export type PolicyStatus = "processing" | "active" | "expiring_soon" | "expired";
export type Actor = "user" | "app" | "insurer" | "tpa" | "govt" | "bank";

export interface Profile {
  id: string;
  name: string;
  email: string;
  language: Language;
  state: string;
  district: string;
  last_track: Track;
  tracks: Track[];
  call_consent: boolean;
  whatsapp_phone: string | null;
  whatsapp_verified_at: string | null;
  whatsapp_opt_in: boolean;
  bank_last4: string | null;
  is_onboarded: boolean;
}

export interface Member {
  id: string;
  name: string;
  relation: string;
  dob: string;
}

export interface LandParcel {
  id: string;
  survey_no: string;
  village: string;
  district: string;
  area_ha: string;
}

export interface Clause {
  id: string;
  type: ClauseType;
  title: Bilingual;
  plain: Bilingual;
  quote: string;
  page: number;
  risk: "low" | "med" | "high";
}

export interface PolicySummary {
  id: string;
  track: Track;
  insurer: string;
  policy_no: string;
  product: string;
  sum_insured: Money;
  end_date: string;
  status: PolicyStatus;
}

export interface Policy extends PolicySummary {
  tpa: string | null;
  start_date: string;
  insured: string[];
  summary: Bilingual;
  intimation_window_hours: number;
  insurer_email: string;
  clauses: Clause[];
  low_confidence_fields: string[];
}

export type IncidentValue = string | number | boolean;

export interface Claim {
  id: string;
  track: Track;
  policy_id: string;
  policy_no: string;
  insurer: string;
  claim_ref: string | null;
  incident: Record<string, IncidentValue>;
  event_at: string;
  intimated_at: string | null;
  intimation_due_at: string;
  amount_claimed: Money;
  amount_approved: Money | null;
  current_stage: string;
  expected_settlement_date: string | null;
  readiness_score: number;
  status: "draft" | "submitted" | "closed";
  is_overdue: boolean;
  coverage_warnings: Clause[];
}

export interface CheckResult {
  id: string;
  code: string;
  passed: boolean;
  severity: Severity;
  message: Bilingual;
  fix: Bilingual;
  bbox: [number, number, number, number] | null;
  overridden_reason: string | null;
}

export interface ClaimDocument {
  id: string;
  checklist_item: string;
  file_name: string;
  status: "checking" | "done";
  job_id: string | null;
  checks: CheckResult[];
}

export interface ChecklistItem {
  code: string;
  required: boolean;
  uploaded: number;
  failing: number;
}

export interface ScoreItem {
  component: "completeness" | "validity" | "coverage" | "timeliness";
  max: number;
  got: number;
  reasons: Bilingual[];
}

export interface ReadinessScore {
  score: number;
  band: ScoreBand;
  breakdown: ScoreItem[];
}

export interface Stage {
  id: string;
  stage_code: string;
  entered_at: string | null;
  actor: Actor;
  response_text: string | null;
  due_at: string | null;
  source: "manual" | "email" | "mock_insurer" | "app";
}

/** GET /claims/{id} — detail with stages, docs, checks and score (PRD §6.2). */
export interface ClaimDetail {
  claim: Claim;
  documents: ClaimDocument[];
  checklist: ChecklistItem[];
  score: ReadinessScore;
  stages: Stage[];
  expected_amount: Money | null;
  overdue_days: number;
  interest_note: Bilingual | null;
}

export interface Escalation {
  letter: Bilingual;
  channels: string[];
}

export interface WhatsAppMessage {
  id: string;
  template_name: string;
  body: Bilingual;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  created_at: string;
}

export interface VoiceIntent {
  intent: "policy_cover" | "start_claim" | "missing_docs" | "claim_status" | "unknown";
  reply: Bilingual;
  route: string | null;
}

/** POST /api/v1/chat (backend/app/features/chat/schemas.py). */
export interface ChatRequestBody {
  message: string;
  language: string;
  track: Track;
  conversation_id: string | null;
}

export interface ChatReply {
  conversation_id: string;
  reply: string;
  reply_en: string;
  language: string;
  translated: boolean;
  intent: VoiceIntent["intent"];
  route: string | null;
}

export interface BillSummary {
  document_id: string;
  bill_no: string;
  date: string;
  provider: string;
  amount: Money;
}

export interface ClaimPack {
  letter: Bilingual;
  form_fields: Record<string, string>;
  bills: BillSummary[];
  total_claimed: Money;
  enclosures: { code: string; is_ticked: boolean }[];
  insurer_email: string;
  blocking_alerts: number;
}

export interface Dashboard {
  name: string;
  active_policies: number;
  open_claims: number;
  average_score: number | null;
  next_deadline: { claim_id: string; kind: "intimation" | "settlement"; due_at: string } | null;
}

export interface Job {
  id: string;
  kind: "extract_policy" | "check_document" | "build_pack";
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  step: string;
  ref_id: string;
  error: string | null;
}

export interface AskAnswer {
  answer: Bilingual;
  citations: { page: number; quote: string }[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details: Record<string, unknown> };
}
