import type { ScoreBand } from "../api/contract";

/** PRD §3.4 bands: 80–100 ready, 60–79 fix a few things, below 60 high risk. */
export function bandFor(score: number): ScoreBand {
  if (score >= 80) return "ready";
  return score >= 60 ? "fix" : "high_risk";
}
