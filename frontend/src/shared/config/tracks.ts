/**
 * Frontend track config — mirrors backend/app/rules/{health,crop}.yaml.
 * Track is data, not branches (rules.md §2.5): screens read from here, never `if (track === …)`.
 */
import type { Track } from "./app";

export type FieldKind = "text" | "date" | "datetime" | "number" | "select" | "checkbox" | "member";

export interface IncidentField {
  key: string;
  kind: FieldKind;
  required: boolean;
  options?: readonly string[];
}

export interface ChecklistSpec {
  code: string;
  /** Only required when this incident field is truthy (e.g. FIR/MLC only for accidents). */
  requiredWhen?: string;
}

export interface ScrollSequenceConfig {
  /** Folder under /public that holds frame-001.webp … frame-NNN.webp */
  dir: string;
  frameCount: number;
}

export interface TrackConfig {
  id: Track;
  sequence: ScrollSequenceConfig;
  /** Hours the user has to intimate the insurer after the event (PRD §2, §3.5). */
  intimationWindowHours: number;
  scoreWeights: Readonly<Record<ScoreComponent, number>>;
  checklist: readonly ChecklistSpec[];
  stages: readonly string[];
  incidentFields: readonly IncidentField[];
  escalationChannels: readonly string[];
  /** Regulatory clocks (PRD §3.5): `stage` is due `hours` after `from` ("event" or a stage code). */
  deadlines: readonly { stage: string; from: string; hours: number }[];
  /** The stage whose due date is the "expected settlement date". */
  settlementStage: string;
  /** Stage entered as soon as a draft is created (null = none). */
  draftStage: string | null;
  /** Who acts for the insurer on this track's timeline. */
  insurerActor: "insurer" | "tpa";
  /** Stages entered when the user sends the claim / reports the loss (POST /claims/{id}/submit). */
  submitStages: readonly string[];
  /** Health: delays beyond the deadline attract interest (2% above bank rate). */
  hasOverdueInterest: boolean;
}

export type ScoreComponent = "completeness" | "validity" | "coverage" | "timeliness";

export const TRACK_CONFIG: Readonly<Record<Track, TrackConfig>> = {
  health: {
    id: "health",
    sequence: { dir: "/sequences/mri", frameCount: 300 },
    intimationWindowHours: 48,
    scoreWeights: { completeness: 35, validity: 30, coverage: 20, timeliness: 15 },
    checklist: [
      { code: "claim_form" },
      { code: "policy_copy" },
      { code: "id_bank_proof" },
      { code: "bills" },
      { code: "prescriptions" },
      { code: "discharge_summary" },
      { code: "investigation_reports" },
      { code: "fir_mlc", requiredWhen: "is_accident" },
    ],
    stages: [
      "draft_prepared",
      "documents_verified",
      "submitted",
      "acknowledged",
      "under_review",
      "query_raised",
      "decision",
      "payment_credited",
    ],
    incidentFields: [
      { key: "patient", kind: "member", required: true },
      { key: "hospital", kind: "text", required: true },
      { key: "admission_date", kind: "date", required: true },
      { key: "discharge_date", kind: "date", required: false },
      { key: "diagnosis", kind: "text", required: true },
      { key: "is_accident", kind: "checkbox", required: false },
      { key: "event_at", kind: "datetime", required: true },
    ],
    escalationChannels: ["grievance_cell", "bima_bharosa"],
    deadlines: [{ stage: "decision", from: "submitted", hours: 30 * 24 }],
    settlementStage: "decision",
    submitStages: ["documents_verified", "submitted"],
    draftStage: "draft_prepared",
    insurerActor: "tpa",
    hasOverdueInterest: true,
  },
  crop: {
    id: "crop",
    sequence: { dir: "/sequences/tractor", frameCount: 300 },
    intimationWindowHours: 72,
    scoreWeights: { completeness: 30, validity: 20, coverage: 25, timeliness: 25 },
    checklist: [
      { code: "intimation_docket" },
      { code: "pmfby_policy" },
      { code: "aadhaar_passbook" },
      { code: "geo_photos" },
      { code: "land_record" },
      { code: "sowing_cert" },
      { code: "premium_proof" },
      { code: "claim_form" },
    ],
    stages: [
      "loss_reported",
      "intimation_forwarded",
      "surveyor_appointed",
      "joint_survey_done",
      "loss_assessed",
      "approved",
      "payment_initiated",
      "payment_credited",
    ],
    incidentFields: [
      { key: "crop", kind: "text", required: true },
      { key: "season", kind: "select", required: true, options: ["kharif", "rabi"] },
      { key: "survey_no", kind: "text", required: true },
      { key: "area_ha", kind: "number", required: true },
      {
        key: "cause",
        kind: "select",
        required: true,
        options: ["hailstorm", "unseasonal_rain", "flood", "pest", "fire", "landslide"],
      },
      { key: "event_at", kind: "datetime", required: true },
    ],
    escalationChannels: ["district_agri_office", "helpline_14447"],
    deadlines: [
      { stage: "loss_reported", from: "event", hours: 72 },
      { stage: "surveyor_appointed", from: "loss_reported", hours: 48 },
      { stage: "payment_credited", from: "joint_survey_done", hours: 15 * 24 },
    ],
    settlementStage: "payment_credited",
    submitStages: ["loss_reported"],
    draftStage: null,
    insurerActor: "insurer",
    hasOverdueInterest: false,
  },
};

export function trackConfig(track: Track): TrackConfig {
  return TRACK_CONFIG[track];
}
