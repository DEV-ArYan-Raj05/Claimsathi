/** Demo handlers for /claims/* (PRD §6.2). */
import type {
  Bilingual,
  Clause,
  Escalation,
  IncidentValue,
  WhatsAppMessage,
} from "../../api/contract";
import type { Track } from "../../config/app";
import { trackConfig } from "../../config/tracks";
import { formatDate } from "../format";
import { buildChecks } from "./checkCatalog";
import { db, newId, save } from "./db";
import { createJob } from "./jobs";
import { buildPack } from "./pack";
import { computeScore } from "./scoring";
import { buildTimeline } from "./tracker";
import type { DemoClaim, DemoStage } from "./types";
import { claimDetail, claimDocs, claimStages, claimView, findClaim, findPolicy } from "./views";

type Body = Record<string, unknown>;
const WAITING_DAYS = 30; // TODO(PRD §3.1): read from the extracted waiting_period clause value

export const listClaims = (track: Track) =>
  db()
    .claims.filter((c) => c.track === track)
    .map(claimView)
    .sort((a, b) => b.event_at.localeCompare(a.event_at));

function coverageWarnings(
  policyId: string,
  eventAt: string,
  incident: Record<string, IncidentValue>,
): Clause[] {
  const policy = findPolicy(policyId);
  const event = new Date(eventAt).getTime();
  const daysIn = (event - new Date(policy.start_date).getTime()) / 86_400_000;
  const warnings: Clause[] = [];
  if (daysIn < WAITING_DAYS && !incident.is_accident) {
    warnings.push(...policy.clauses.filter((c) => c.type === "waiting_period"));
  }
  if (event > new Date(policy.end_date).getTime() + 86_400_000) {
    warnings.push({
      id: "expired",
      type: "fine_print",
      risk: "high",
      page: 1,
      quote: policy.end_date,
      title: { en: "Policy had ended", hi: "पॉलिसी ख़त्म हो चुकी थी" },
      plain: {
        en: "The event happened after this policy ended.",
        hi: "घटना इस पॉलिसी के ख़त्म होने के बाद हुई।",
      },
    });
  }
  return warnings.map((w) => ({ ...w, risk: "high" }));
}

export function createClaim(body: Body) {
  const policy = findPolicy(String(body.policy_id));
  const incident = (body.incident ?? {}) as Record<string, IncidentValue>;
  const eventAt = new Date(String(body.event_at)).toISOString();
  const claim: DemoClaim = {
    id: newId("clm"),
    track: policy.track,
    policy_id: policy.id,
    policy_no: policy.policy_no,
    insurer: policy.insurer,
    claim_ref: null,
    incident,
    event_at: eventAt,
    intimated_at: null,
    amount_claimed: String(body.amount_claimed ?? "0.00"),
    amount_approved: null,
    current_stage: "",
    status: "draft",
    coverage_warnings: coverageWarnings(policy.id, eventAt, incident),
  };
  db().claims.push(claim);
  const draft = trackConfig(policy.track).draftStage;
  if (draft) addStage(claim.id, draft, "user", null, "app");
  save();
  return claimView(claim);
}

function addStage(
  claimId: string,
  code: string,
  actor: DemoStage["actor"],
  text: string | null,
  source: DemoStage["source"],
) {
  db().stages.push({
    id: newId("stg"),
    claim_id: claimId,
    stage_code: code,
    entered_at: new Date().toISOString(),
    actor,
    response_text: text,
    due_at: null,
    source,
  });
}

export function attachDocument(claimId: string, body: Body) {
  findClaim(claimId);
  const item = String(body.checklist_item);
  const replaces = body.replaces ? String(body.replaces) : null;
  const old = replaces ? db().documents.find((d) => d.id === replaces) : undefined;
  const id = newId("doc");
  const job = createJob("check_document", id, 2600);
  db().documents.push({
    id,
    claim_id: claimId,
    checklist_item: item,
    file_name: String(body.file_name ?? "upload.jpg"),
    status: "checking",
    job_id: job.id,
    uploaded_at: new Date().toISOString(),
    replaces,
    checks: buildChecks(item),
    bill: old?.bill
      ? { ...old.bill, document_id: id }
      : item === "bills"
        ? {
            document_id: id,
            bill_no: "—",
            date: new Date().toISOString().slice(0, 10),
            provider: "—",
            amount: "0.00",
          }
        : null,
  });
  save();
  return { document_id: id, job_id: job.id };
}

export function overrideCheck(claimId: string, checkId: string, body: Body) {
  const doc = claimDocs(claimId).find((d) => d.checks.some((c) => c.id === checkId));
  const check = doc?.checks.find((c) => c.id === checkId);
  if (!check) throw new Error("CHECK_NOT_FOUND");
  check.overridden_reason = String(body.reason ?? "").slice(0, 300) || "—";
  save();
  return check;
}

export function score(claimId: string) {
  const claim = findClaim(claimId);
  const t = buildTimeline(claim, claimStages(claimId));
  return computeScore(claim, claimDocs(claimId), t.intimationDueAt);
}

export const pack = (claimId: string) => {
  const claim = findClaim(claimId);
  return buildPack(claim, findPolicy(claim.policy_id), db().profile, claimDocs(claimId));
};

export function submit(claimId: string, body: Body) {
  const claim = findClaim(claimId);
  const cfg = trackConfig(claim.track);
  cfg.submitStages.forEach((code) => {
    if (!claimStages(claimId).some((s) => s.stage_code === code))
      addStage(claimId, code, "user", String(body.channel ?? "email"), "manual");
  });
  claim.status = "submitted";
  claim.intimated_at ??= new Date().toISOString();
  claim.claim_ref ??= `DEMO/${claim.id.slice(-5).toUpperCase()}`;
  save();
  return claimView(claim);
}

export function addUserStage(claimId: string, body: Body) {
  const claim = findClaim(claimId);
  const code = String(body.stage_code);
  if (!trackConfig(claim.track).stages.includes(code)) throw new Error("STAGE_INVALID");
  addStage(claimId, code, "user", body.response_text ? String(body.response_text) : null, "manual");
  save();
  return claimDetail(claimId);
}

const PARSE_RULES: [RegExp, string][] = [
  [/credited|paid|neft|जमा/i, "payment_credited"],
  [/approved|sanction|मंज़ूर/i, "decision"],
  [/approved|sanction|मंज़ूर/i, "approved"],
  [/query|please send|required|ज़रूरत|भेजें/i, "query_raised"],
  [/surveyor/i, "surveyor_appointed"],
  [/joint survey|survey (done|completed)/i, "joint_survey_done"],
  [/claim (no|number)|acknowledg|docket/i, "acknowledged"],
];

/** Suggest a stage from forwarded insurer text (demo keyword matcher; real one uses the LLM). */
export function parseStage(claimId: string, body: Body) {
  const stages = trackConfig(findClaim(claimId).track).stages;
  const text = String(body.text ?? "");
  const hit = PARSE_RULES.find(([re, code]) => re.test(text) && stages.includes(code));
  return { stage_code: hit?.[1] ?? null };
}

export function escalation(claimId: string): Escalation {
  const claim = findClaim(claimId);
  const d = claimDetail(claimId);
  const body = (lang: "en" | "hi"): string =>
    lang === "en"
      ? `To the Grievance Officer,\n${claim.insurer}\n\nMy claim ${claim.claim_ref ?? ""} under policy ${claim.policy_no} is ${d.overdue_days} days past the deadline set by regulation. Please settle it or tell me in writing what is pending.\n\n${db().profile.name}`
      : `शिकायत अधिकारी,\n${claim.insurer}\n\nपॉलिसी ${claim.policy_no} के तहत मेरा क्लेम ${claim.claim_ref ?? ""} नियम के अनुसार तय समय-सीमा से ${d.overdue_days} दिन ऊपर हो चुका है। कृपया इसका निपटारा करें या लिखित में बताएँ कि क्या बाकी है।\n\n${db().profile.name}`;
  return {
    letter: { en: body("en"), hi: body("hi") },
    channels: [...trackConfig(claim.track).escalationChannels],
  };
}

export function whatsappLog(claimId: string): WhatsAppMessage[] {
  if (!db().profile.whatsapp_opt_in) return [];
  const claim = findClaim(claimId);
  return claimStages(claimId).map((s) => {
    const text: Bilingual = {
      en: `Your claim ••${claim.policy_no.slice(-4)} is now: ${s.stage_code.replace(/_/g, " ")}. Updated ${formatDate(s.entered_at ?? "", "en")}.`,
      hi: `आपका क्लेम ••${claim.policy_no.slice(-4)} अब इस चरण में है: ${s.stage_code.replace(/_/g, " ")}। ${formatDate(s.entered_at ?? "", "hi")}`,
    };
    return {
      id: `wa_${s.id}`,
      template_name: "stage_changed",
      body: text,
      status: "delivered",
      created_at: s.entered_at ?? "",
    };
  });
}

/** Demo-only insurer console: enter the next pending stage (PRD §3.5). */
export function advance(claimId: string, body: Body) {
  const claim = findClaim(claimId);
  const pending = buildTimeline(claim, claimStages(claimId)).stages.filter(
    (s) => !s.entered_at && s.stage_code !== "query_raised",
  );
  const code = body.stage_code ? String(body.stage_code) : pending[0]?.stage_code;
  if (!code) return claimDetail(claimId);
  if (body.amount_approved) claim.amount_approved = String(body.amount_approved);
  addStage(
    claimId,
    code,
    trackConfig(claim.track).insurerActor,
    body.response_text ? String(body.response_text) : null,
    "mock_insurer",
  );
  if (code === trackConfig(claim.track).stages.at(-1)) claim.status = "closed";
  save();
  return claimDetail(claimId);
}
