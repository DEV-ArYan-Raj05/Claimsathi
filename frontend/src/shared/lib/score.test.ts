import { describe, expect, it } from "vitest";
import { bandFor } from "./score";

describe("bandFor", () => {
  it("uses the PRD band edges", () => {
    expect(bandFor(100)).toBe("ready");
    expect(bandFor(80)).toBe("ready");
    expect(bandFor(79)).toBe("fix");
    expect(bandFor(60)).toBe("fix");
    expect(bandFor(59)).toBe("high_risk");
    expect(bandFor(0)).toBe("high_risk");
  });
});
