/** "Update status": paste the insurer's SMS/email to get a suggested stage, or pick one yourself. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Stage } from "@/shared/api/contract";
import { Button } from "@/shared/ui/button";
import { Field, Select, Textarea } from "@/shared/ui/field";
import { useAddStage, useParseStage } from "../hooks/useTracker";

export function UpdateStatus({ claimId, stages }: { claimId: string; stages: Stage[] }) {
  const { t } = useTranslation("tracker");
  const parse = useParseStage(claimId);
  const add = useAddStage(claimId);
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const pending = stages.filter((s) => !s.entered_at);

  const suggest = async () => {
    const r = await parse.mutateAsync(text);
    if (r.stage_code) setCode(r.stage_code);
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (code)
          add.mutate(
            { code, text: text.trim() || null },
            {
              onSuccess: () => {
                setText("");
                setCode("");
              },
            },
          );
      }}
    >
      <h2 className="text-lg font-bold">{t("update.title")}</h2>
      <Field id="upd-text" label={t("update.pasteLabel")} hint={t("update.pasteHint")}>
        <Textarea id="upd-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Button
        variant="outline"
        disabled={!text.trim()}
        isBusy={parse.isPending}
        onClick={() => void suggest()}
      >
        {t("update.suggest")}
      </Button>
      {parse.data && (
        <p role="status" className="text-sm">
          {parse.data.stage_code
            ? t("update.suggested", {
                stage: t(`stage.${parse.data.stage_code}`, { ns: "common" }),
              })
            : t("update.noSuggestion")}
        </p>
      )}
      <Field id="upd-stage" label={t("update.stageLabel")}>
        <Select id="upd-stage" value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">{t("update.choose")}</option>
          {pending.map((s) => (
            <option key={s.stage_code} value={s.stage_code}>
              {t(`stage.${s.stage_code}`, { ns: "common" })}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="solid" disabled={!code} isBusy={add.isPending}>
        {t("update.save")}
      </Button>
    </form>
  );
}
