import { describe, expect, it } from "vitest";
import type { ClaimDetail } from "@/shared/api/contract";
import { blockingCount, buildAlerts } from "./utils";

const check = (
  id: string,
  severity: "critical" | "high" | "medium",
  passed: boolean,
  overridden: string | null = null,
) => ({
  id,
  code: id,
  passed,
  severity,
  message: { en: "", hi: "" },
  fix: { en: "", hi: "" },
  bbox: null,
  overridden_reason: overridden,
});

const detail = {
  checklist: [
    { code: "bills", required: true, uploaded: 1, failing: 1 },
    { code: "claim_form", required: true, uploaded: 0, failing: 0 },
    { code: "fir_mlc", required: false, uploaded: 0, failing: 0 },
  ],
  documents: [
    {
      id: "d1",
      checklist_item: "bills",
      file_name: "a.jpg",
      status: "done",
      job_id: null,
      checks: [
        check("HIGH", "high", false),
        check("CRIT", "critical", false),
        check("OK", "critical", true),
      ],
    },
    {
      id: "d2",
      checklist_item: "bills",
      file_name: "b.jpg",
      status: "done",
      job_id: null,
      checks: [check("OVR", "critical", false, "clinic closed")],
    },
  ],
} as unknown as ClaimDetail;

describe("buildAlerts", () => {
  it("orders missing items, then critical, high, then overridden", () => {
    expect(buildAlerts(detail).map((a) => (a.kind === "missing" ? a.code : a.check.code))).toEqual([
      "claim_form",
      "CRIT",
      "HIGH",
      "OVR",
    ]);
  });

  it("only un-overridden critical failures block sending", () => {
    expect(blockingCount(detail)).toBe(1);
  });
});
