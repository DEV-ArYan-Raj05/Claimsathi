/** Family members (health) and land parcels (crop) — both shown, each labelled by track. */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { addMember, addParcel, getMembers, getParcels } from "@/features/auth";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/field";

export function MembersCard() {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const add = useMutation({
    mutationFn: addMember,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["members"] }),
  });
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  return (
    <Card data-track="health" className="space-y-3">
      <h2 className="text-xl font-bold">{t("members.title")}</h2>
      <ul className="divide-y divide-ink/10">
        {members.data?.map((m) => (
          <li key={m.id} className="py-2">
            {m.name}{" "}
            <span className="text-caption">
              ({t(`relation.${m.relation}`, { defaultValue: m.relation })})
            </span>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (name && relation)
            add.mutate(
              { name, relation, dob: "" },
              {
                onSuccess: () => {
                  setName("");
                  setRelation("");
                },
              },
            );
        }}
      >
        <Field id="mem-name" label={t("members.name")}>
          <Input id="mem-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="mem-rel" label={t("members.relation")}>
          <Input id="mem-rel" value={relation} onChange={(e) => setRelation(e.target.value)} />
        </Field>
        <Button type="submit" variant="solid" isBusy={add.isPending}>
          {t("members.add")}
        </Button>
      </form>
    </Card>
  );
}

export function ParcelsCard() {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();
  const parcels = useQuery({ queryKey: ["parcels"], queryFn: getParcels });
  const add = useMutation({
    mutationFn: addParcel,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["parcels"] }),
  });
  const [form, setForm] = useState({ survey_no: "", village: "", district: "", area_ha: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const isValid = Object.values(form).every(Boolean) && /^\d+(\.\d{1,2})?$/.test(form.area_ha);
  return (
    <Card data-track="crop" className="space-y-3">
      <h2 className="text-xl font-bold">{t("parcels.title")}</h2>
      <ul className="divide-y divide-ink/10">
        {parcels.data?.map((p) => (
          <li key={p.id} className="py-2">
            {t("parcels.line", {
              survey: p.survey_no,
              village: p.village,
              district: p.district,
              area: p.area_ha,
            })}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid)
            add.mutate(form, {
              onSuccess: () => setForm({ survey_no: "", village: "", district: "", area_ha: "" }),
            });
        }}
      >
        {(["survey_no", "village", "district", "area_ha"] as const).map((k) => (
          <Field key={k} id={`lp-${k}`} label={t(`parcels.${k}`)}>
            <Input
              id={`lp-${k}`}
              inputMode={k === "area_ha" ? "decimal" : undefined}
              value={form[k]}
              onChange={set(k)}
            />
          </Field>
        ))}
        <Button
          type="submit"
          variant="solid"
          disabled={!isValid}
          isBusy={add.isPending}
          className="sm:col-span-2 sm:justify-self-start"
        >
          {t("parcels.add")}
        </Button>
      </form>
    </Card>
  );
}
