/** Turn stored demo rows into API responses (computed fields filled in code). */
import type { Claim, ClaimDetail } from "../../api/contract";
import { db } from "./db";
import { buildChecklist, computeScore } from "./scoring";
import { buildTimeline } from "./tracker";
import type { DemoClaim } from "./types";

export class DemoNotFound extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function findClaim(id: string): DemoClaim {
  const claim = db().claims.find((c) => c.id === id);
  if (!claim) throw new DemoNotFound("CLAIM_NOT_FOUND");
  return claim;
}

export function findPolicy(id: string) {
  const policy = db().policies.find((p) => p.id === id);
  if (!policy) throw new DemoNotFound("POLICY_NOT_FOUND");
  return policy;
}

export const claimDocs = (id: string) => db().documents.filter((d) => d.claim_id === id);
export const claimStages = (id: string) => db().stages.filter((s) => s.claim_id === id);

export function claimView(claim: DemoClaim): Claim {
  const timeline = buildTimeline(claim, claimStages(claim.id));
  const score = computeScore(claim, claimDocs(claim.id), timeline.intimationDueAt);
  return {
    ...claim,
    current_stage: timeline.currentStage,
    readiness_score: score.score,
    expected_settlement_date: timeline.expectedSettlement,
    intimation_due_at: timeline.intimationDueAt,
    is_overdue: timeline.overdueDays > 0,
  };
}

export function claimDetail(id: string): ClaimDetail {
  const claim = findClaim(id);
  const docs = claimDocs(id);
  const timeline = buildTimeline(claim, claimStages(id));
  return {
    claim: claimView(claim),
    documents: docs.filter((d) => !docs.some((o) => o.replaces === d.id)),
    checklist: buildChecklist(claim, docs),
    score: computeScore(claim, docs, timeline.intimationDueAt),
    stages: timeline.stages,
    expected_amount: claim.amount_approved ?? claim.amount_claimed,
    overdue_days: timeline.overdueDays,
    interest_note: timeline.interestNote,
  };
}
