/**
 * Stage timeline + expected dates (PRD §3.5). Every date is computed here in code from the
 * deadline rules in track config — mirrors backend/app/features/tracker/service_dates.py.
 */
import type { Bilingual, Stage } from "../../api/contract";
import { addHours } from "../format";
import { trackConfig } from "../../config/tracks";
import type { DemoClaim, DemoStage } from "./types";

export interface TimelineResult {
  stages: Stage[];
  currentStage: string;
  expectedSettlement: string | null;
  intimationDueAt: string;
  overdueDays: number;
  interestNote: Bilingual | null;
}

const DAY_MS = 86_400_000;

/** Build the full stage list for a claim, filling due dates for pending stages. */
export function buildTimeline(
  claim: DemoClaim,
  entered: DemoStage[],
  now = Date.now(),
): TimelineResult {
  const cfg = trackConfig(claim.track);
  const byCode = new Map(entered.map((s) => [s.stage_code, s]));
  const anchor = (from: string): string | null =>
    from === "event" ? claim.event_at : (byCode.get(from)?.entered_at ?? null);

  const dueFor = (code: string): string | null => {
    const rule = cfg.deadlines.find((d) => d.stage === code);
    const base = rule ? anchor(rule.from) : null;
    return rule && base ? addHours(base, rule.hours) : null;
  };

  const stages: Stage[] = cfg.stages.map((code, i) => {
    const hit = byCode.get(code);
    if (hit) return { ...hit };
    return {
      id: `pending_${claim.id}_${i}`,
      stage_code: code,
      entered_at: null,
      actor: "insurer",
      response_text: null,
      due_at: dueFor(code),
      source: "app",
    };
  });

  const done = stages.filter((s) => s.entered_at);
  const currentStage = done.at(-1)?.stage_code ?? "";
  // Overdue = the earliest pending stage whose regulatory due date has already passed.
  const passed = stages
    .filter((s) => !s.entered_at && s.due_at && new Date(s.due_at).getTime() < now)
    .map((s) => new Date(s.due_at ?? "").getTime());
  const overdueDays = passed.length ? Math.ceil((now - Math.min(...passed)) / DAY_MS) : 0;

  const intimationRule = { hours: cfg.intimationWindowHours };
  return {
    stages,
    currentStage,
    expectedSettlement: byCode.has(cfg.settlementStage) ? null : dueFor(cfg.settlementStage),
    intimationDueAt: addHours(claim.event_at, intimationRule.hours),
    overdueDays,
    interestNote:
      overdueDays > 0 && cfg.hasOverdueInterest
        ? {
            en: "The insurer is past the 30-day deadline. You can ask for interest at 2% above the bank rate for the delay.",
            hi: "बीमा कंपनी 30 दिन की समय-सीमा पार कर चुकी है। आप देरी के लिए बैंक दर से 2% ज़्यादा ब्याज माँग सकते हैं।",
          }
        : null,
  };
}
