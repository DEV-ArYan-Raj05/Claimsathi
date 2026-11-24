/**
 * Upload helpers (PRD §4.5, rules.md §10): check type by magic bytes, cap at 20 MB,
 * and shrink photos on-device (max 1600 px, ~80% JPEG) so uploads survive 3G.
 */
import { MAX_UPLOAD_MB, UPLOAD_JPEG_QUALITY, UPLOAD_MAX_EDGE_PX } from "../config/app";

export type FileKind = "jpeg" | "png" | "pdf" | "heic";
export type FileProblem = "too_large" | "unsupported";

const SIGNATURES: { kind: FileKind; offset: number; bytes: number[] }[] = [
  { kind: "jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { kind: "png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { kind: "pdf", offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
  { kind: "heic", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // "ftyp" box
];

/** Identify a file from its first bytes, not its name. */
export function sniffKind(head: Uint8Array): FileKind | null {
  const hit = SIGNATURES.find(({ offset, bytes }) => bytes.every((b, i) => head[offset + i] === b));
  return hit?.kind ?? null;
}

export async function validateFile(
  file: File,
): Promise<{ kind: FileKind } | { problem: FileProblem }> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return { problem: "too_large" };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const kind = sniffKind(head);
  return kind ? { kind } : { problem: "unsupported" };
}

/** Downscale JPEG/PNG photos before upload; PDFs and HEIC pass through untouched. */
export async function compressImage(file: File, kind: FileKind): Promise<Blob> {
  if (kind !== "jpeg" && kind !== "png") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, UPLOAD_MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", UPLOAD_JPEG_QUALITY),
  );
}
