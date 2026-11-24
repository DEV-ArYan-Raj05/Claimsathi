/** x-05 New claim: pick policy, incident form (fields per track), coverage check before going on. */
import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePolicies } from "@/features/policies";
import type { Claim } from "@/shared/api/contract";
import { PageHeader } from "@/shared/components/PageHeader";
import { QueryView } from "@/shared/components/QueryView";
import { EmptyState } from "@/shared/components/StateViews";
import { trackConfig } from "@/shared/config/tracks";
import { useLang } from "@/shared/hooks/useLang";
import { useTrack } from "@/shared/hooks/useTrack";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/field";
import { IncidentFields } from "../components/IncidentFields";
import { useCreateClaim } from "../hooks/useClaims";
import { incidentSchema, type IncidentFormValues } from "../schemas";

export function X05NewClaimPage() {
  const { t } = useTranslation("claims");
  const track = useTrack();
  const { pick } = useLang();
  const navigate = useNavigate();
  const cfg = trackConfig(track);
  const policies = usePolicies(track);
  const create = useCreateClaim(track);
  const [created, setCreated] = useState<Claim | null>(null);
  const schema = useMemo(() => incidentSchema(cfg.incidentFields), [cfg]);
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<IncidentFormValues>,
    defaultValues: { amount_claimed: "" },
  });
  const docsPath = (id: string) => `/${track}/claims/${id}/documents`;

  const onSubmit = form.handleSubmit(async (v) => {
    const incident = Object.fromEntries(
      cfg.incidentFields.filter((f) => f.key !== "event_at").map((f) => [f.key, v[f.key] ?? ""]),
    ) as Claim["incident"];
    const claim = await create.mutateAsync({
      policy_id: String(v.policy_id),
      event_at: new Date(String(v.event_at)).toISOString(),
      amount_claimed: Number(v.amount_claimed).toFixed(2),
      incident,
    });
    if (claim.coverage_warnings.length) setCreated(claim);
    else navigate(docsPath(claim.id));
  });

  if (created) {
    return (
      <>
        <PageHeader title={t("warning.title")} />
        <Card className="space-y-4 border-l-[6px] border-accent">
          <p className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle aria-hidden className="h-5 w-5" />
            {t("warning.lead")}
          </p>
          <ul className="space-y-2">
            {created.coverage_warnings.map((w) => (
              <li key={w.id}>
                <b>{pick(w.title)}</b> {pick(w.plain)}{" "}
                <span className="text-caption">{t("warning.page", { page: w.page })}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="solid" onClick={() => navigate(docsPath(created.id))}>
              {t("warning.continue")}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/${track}/claims`)}>
              {t("warning.stop")}
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t(`new.title.${track}`)}
        subtitle={t(`new.subtitle.${track}`)}
        backTo={`/${track}`}
      />
      <QueryView
        query={policies}
        isEmpty={(d) => !d.some((p) => p.status !== "expired")}
        empty={
          <EmptyState
            title={t("new.noPolicyTitle")}
            body={t("new.noPolicyBody")}
            action={
              <Button variant="solid" onClick={() => navigate(`/${track}/policies/new`)}>
                {t("new.addPolicy")}
              </Button>
            }
          />
        }
      >
        {(list) => (
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            <Card className="space-y-4">
              <Field
                id="inc-policy"
                label={t("field.policy_id")}
                error={form.formState.errors.policy_id ? t("form.required") : undefined}
              >
                <Select id="inc-policy" {...form.register("policy_id")}>
                  <option value="">{t("form.choose")}</option>
                  {list
                    .filter((p) => p.status !== "expired")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product}
                      </option>
                    ))}
                </Select>
              </Field>
              <IncidentFields fields={cfg.incidentFields} form={form} />
              <Field
                id="inc-amount"
                label={t(`field.amount_claimed.${track}`)}
                hint={t(`hint.amount_claimed.${track}`)}
                error={form.formState.errors.amount_claimed ? t("form.amount") : undefined}
              >
                <Input id="inc-amount" inputMode="decimal" {...form.register("amount_claimed")} />
              </Field>
            </Card>
            {create.isError && (
              <p role="alert" className="text-on-dominant">
                {t("form.failed")}
              </p>
            )}
            <Button type="submit" variant="primary" isBusy={create.isPending}>
              {t("new.next")}
            </Button>
          </form>
        )}
      </QueryView>
    </>
  );
}
