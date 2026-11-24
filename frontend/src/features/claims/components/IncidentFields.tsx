/** Renders the track's incident fields from config — one form for both tracks. */
import type { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getMembers } from "@/features/auth";
import { DictateButton } from "@/features/voice";
import type { IncidentField } from "@/shared/config/tracks";
import { Checkbox, Field, Input, Select } from "@/shared/ui/field";
import type { IncidentFormValues } from "../schemas";

const INPUT_TYPE: Partial<Record<IncidentField["kind"], string>> = {
  date: "date",
  datetime: "datetime-local",
  number: "number",
};

export function IncidentFields({
  fields,
  form,
}: {
  fields: readonly IncidentField[];
  form: UseFormReturn<IncidentFormValues>;
}) {
  const { t } = useTranslation("claims");
  const members = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
    enabled: fields.some((f) => f.kind === "member"),
  });
  const { register, setValue, formState } = form;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `inc-${f.key}`;
        const label = t(`field.${f.key}`);
        const error = formState.errors[f.key] ? t("form.required") : undefined;
        if (f.kind === "checkbox")
          return (
            <div key={f.key} className="sm:col-span-2">
              <Checkbox id={id} label={label} {...register(f.key)} />
            </div>
          );
        return (
          <Field
            key={f.key}
            id={id}
            label={label}
            error={error}
            hint={t(`hint.${f.key}`, { defaultValue: "" }) || undefined}
          >
            {f.kind === "select" ? (
              <Select id={id} {...register(f.key)}>
                <option value="">{t("form.choose")}</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {t(`option.${o}`)}
                  </option>
                ))}
              </Select>
            ) : f.kind === "member" ? (
              <Select id={id} {...register(f.key)}>
                <option value="">{t("form.choose")}</option>
                {members.data?.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  id={id}
                  type={INPUT_TYPE[f.kind] ?? "text"}
                  step={f.kind === "number" ? "0.01" : undefined}
                  {...register(f.key)}
                />
                {f.kind === "text" && (
                  <DictateButton
                    fieldLabel={label}
                    onText={(text) => setValue(f.key, text, { shouldValidate: true })}
                  />
                )}
              </div>
            )}
          </Field>
        );
      })}
    </div>
  );
}
