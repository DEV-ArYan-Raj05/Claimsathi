import { z } from "zod";

/** Key-field corrections on x-03 — mirrors PATCH /policies/{id} (PolicyPatch in schemas.py). */
export const policyReviewSchema = z.object({
  insurer: z.string().trim().min(2),
  policy_no: z.string().trim().min(4),
  sum_insured: z.string().regex(/^\d+(\.\d{1,2})?$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type PolicyReview = z.infer<typeof policyReviewSchema>;
