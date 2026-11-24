import { describe, expect, it } from "vitest";
import { addDays, formatMoney, maskTail, sumPaise, timeLeft, toPaise } from "./format";

describe("money", () => {
  it("parses rupees into exact paise", () => {
    expect(toPaise("1234.5")).toBe(123450);
    expect(toPaise(0.1)).toBe(10);
    expect(toPaise("-20")).toBe(-2000);
  });

  it("sums without float drift", () => {
    expect(sumPaise(["0.10", "0.20"])).toBe(30);
    expect(sumPaise([1200, "350.75", "49.25"])).toBe(160000);
  });

  it("formats with Indian grouping", () => {
    expect(formatMoney(10_000_000)).toBe("₹1,00,000");
    expect(formatMoney(123450)).toBe("₹1,234.50");
  });

  it("rejects non-numbers", () => {
    expect(() => toPaise("12a")).toThrow();
  });
});

describe("dates", () => {
  it("counts down and flags overdue", () => {
    const now = Date.parse("2026-11-24T00:00:00Z");
    expect(timeLeft("2026-11-25T06:30:00Z", now)).toEqual({
      hours: 30,
      minutes: 30,
      isOverdue: false,
    });
    expect(timeLeft("2026-11-23T23:00:00Z", now).isOverdue).toBe(true);
  });

  it("adds days in UTC", () => {
    expect(addDays("2026-11-01T00:00:00.000Z", 30)).toBe("2026-12-01T00:00:00.000Z");
  });
});

describe("masking", () => {
  it("keeps only the last four", () => {
    expect(maskTail("PMFBY 2026 0045 8812")).toBe("••••8812");
  });
});
