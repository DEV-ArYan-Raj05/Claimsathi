/** "Ask this policy" — answers grounded only in this policy's text, with page citations. */
import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Track } from "@/shared/config/app";
import { useLang } from "@/shared/hooks/useLang";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { useAskPolicy } from "../hooks/usePolicies";

export function AskPolicy({ policyId, track }: { policyId: string; track: Track }) {
  const { t } = useTranslation("policies");
  const { lang, pick } = useLang();
  const ask = useAskPolicy(policyId);
  const [question, setQuestion] = useState("");
  const suggestions = t(`ask.suggestions.${track}`, { returnObjects: true }) as string[];

  const submit = (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    ask.mutate({ question: q, lang });
  };

  return (
    <section aria-labelledby="ask-title" className="space-y-3">
      <h2 id="ask-title" className="text-xl font-bold">
        {t("ask.title")}
      </h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          {t("ask.label")}
        </label>
        <Input
          id="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("ask.placeholder")}
        />
        <Button type="submit" variant="solid" aria-label={t("ask.send")} isBusy={ask.isPending}>
          <Send aria-hidden className="h-4 w-4" />
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            className="min-h-tap rounded-full bg-ink/10 px-4 text-sm"
          >
            {s}
          </button>
        ))}
      </div>
      {ask.isError && <p role="alert">{t("ask.failed")}</p>}
      {ask.data && (
        <div role="status" className="rounded-xl bg-ink/5 p-4">
          <p className="text-base">{pick(ask.data.answer)}</p>
          {ask.data.citations.map((c) => (
            <p key={c.page + c.quote} className="mt-2 text-sm text-caption">
              {t("detail.page", { page: c.page })}: “{c.quote}”
            </p>
          ))}
          <p className="mt-3 text-sm text-caption">{t("ask.disclaimer")}</p>
        </div>
      )}
    </section>
  );
}
