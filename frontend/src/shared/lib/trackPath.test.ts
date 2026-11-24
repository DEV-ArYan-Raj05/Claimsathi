import { describe, expect, it } from "vitest";
import { equivalentPath } from "./trackPath";

describe("equivalentPath", () => {
  it("keeps the equivalent screen when switching track", () => {
    expect(equivalentPath("/health/policies", "crop")).toBe("/crop/policies");
    expect(equivalentPath("/health/claims/new", "crop")).toBe("/crop/claims/new");
    expect(equivalentPath("/crop", "health")).toBe("/health");
  });

  it("drops ids that only exist in the other track", () => {
    expect(equivalentPath("/health/claims/clm_h1/documents", "crop")).toBe("/crop/claims");
  });

  it("goes to the track home from shared screens", () => {
    expect(equivalentPath("/settings", "crop")).toBe("/crop");
  });
});
