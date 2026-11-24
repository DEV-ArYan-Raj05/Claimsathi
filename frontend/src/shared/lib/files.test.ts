import { describe, expect, it } from "vitest";
import { sniffKind } from "./files";

describe("sniffKind", () => {
  it("detects by magic bytes", () => {
    expect(sniffKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniffKind(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe("pdf");
    expect(sniffKind(new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]))).toBe("heic");
  });

  it("rejects a renamed text file", () => {
    expect(sniffKind(new TextEncoder().encode("hello.pdf"))).toBeNull();
  });
});
