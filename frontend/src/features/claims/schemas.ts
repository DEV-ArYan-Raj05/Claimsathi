/**
 * Incident form schema, built from the track's field list in shared/config/tracks.ts so both
 * tracks share one form. Mirrors ClaimCreate in backend/app/features/claims/schemas.py.
 */
import { z } from "zod";
import type { IncidentField } from "@/shared/config/tracks";

function fieldSchema(f: IncidentField): z.ZodType {
  if (f.kind === "checkbox") return z.boolean();
  if (f.kind === "number")
    return f.required ? z.coerce.number().positive() : z.coerce.number().nonnegative().optional();
  const text = z.string().trim();
  if (f.kind === "select" && f.options) return z.enum(f.options as [string, ...string[]]);
  return f.required ? text.min(1) : text.optional();
}

export function incidentSchema(fields: readonly IncidentField[]) {
  return z.object({
    policy_id: z.string().min(1),
    amount_claimed: z.string().regex(/^\d{1,9}(\.\d{1,2})?$/),
    ...Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])),
  });
}

export type IncidentFormValues = Record<string, string | number | boolean | undefined>;
