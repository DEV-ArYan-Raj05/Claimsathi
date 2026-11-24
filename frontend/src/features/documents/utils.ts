/** Turn claim detail into an ordered alert list: missing items first, then failed checks by severity. */
import type { CheckResult, ClaimDetail, ClaimDocument } from "@/shared/api/contract";

export type AlertEntry =
  | { kind: "missing"; code: string }
  | { kind: "check"; check: CheckResult; document: ClaimDocument };

const RANK: Record<CheckResult["severity"], number> = { critical: 0, high: 1, medium: 2 };

export function buildAlerts(detail: ClaimDetail): AlertEntry[] {
  const missing: AlertEntry[] = detail.checklist
    .filter((c) => c.required && c.uploaded === 0)
    .map((c) => ({ kind: "missing", code: c.code }));
  const failed = detail.documents
    .filter((d) => d.status === "done")
    .flatMap((d) =>
      d.checks
        .filter((c) => !c.passed)
        .map((check) => ({ kind: "check" as const, check, document: d })),
    )
    .sort(
      (a, b) =>
        Number(Boolean(a.check.overridden_reason)) - Number(Boolean(b.check.overridden_reason)) ||
        RANK[a.check.severity] - RANK[b.check.severity],
    );
  return [...missing, ...failed];
}

/** Critical failures that block "Send to insurer" until fixed or overridden (PRD §3.3). */
export function blockingCount(detail: ClaimDetail): number {
  return buildAlerts(detail).filter(
    (a) => a.kind === "check" && a.check.severity === "critical" && !a.check.overridden_reason,
  ).length;
}
