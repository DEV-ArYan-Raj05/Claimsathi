/** Confirm or correct the key extracted fields; low-confidence ones say "AI read this, please check". */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import type { Policy } from "@/shared/api/contract";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { usePatchPolicy } from "../hooks/usePolicies";
import { policyReviewSchema, type PolicyReview } from "../schemas";

const FIELDS = ["insurer", "policy_no", "sum_insured", "start_date", "end_date"] as const;

export function ReviewPolicyForm({ policy, onSaved }: { policy: Policy; onSaved: () => void }) {
  const { t } = useTranslation("policies");
  const patch = usePatchPolicy(policy.id);
  const { register, handleSubmit, formState } = useForm<PolicyReview>({
    resolver: zodResolver(policyReviewSchema),
    defaultValues: Object.fromEntries(FIELDS.map((f) => [f, policy[f]])) as PolicyReview,
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) =>
        void handleSubmit(async (v) => {
          await patch.mutateAsync(v);
          onSaved();
        })(e)
      }
    >
      <h2 className="text-lg font-bold">{t("add.reviewTitle")}</h2>
      {FIELDS.map((f) => (
        <Field
          key={f}
          id={`pf-${f}`}
          label={t(`field.${f}`)}
          hint={policy.low_confidence_fields.includes(f) ? t("add.pleaseCheck") : undefined}
          error={formState.errors[f] ? t("add.invalid") : undefined}
        >
          <Input
            id={`pf-${f}`}
            type={f.endsWith("date") ? "date" : "text"}
            inputMode={f === "sum_insured" ? "decimal" : undefined}
            {...register(f)}
          />
        </Field>
      ))}
      <Button type="submit" variant="primary" isBusy={patch.isPending}>
        {t("add.save")}
      </Button>
    </form>
  );
}
