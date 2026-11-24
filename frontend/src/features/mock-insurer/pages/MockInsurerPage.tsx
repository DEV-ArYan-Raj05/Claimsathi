/** /admin/mock-insurer — demo only, hidden from nav, not mounted in production (rules.md §10). */
import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Claim, ClaimDetail } from "@/shared/api/contract";
import { StatusChip } from "@/shared/components/StatusChip";
import { TRACKS } from "@/shared/config/app";
import { api } from "@/shared/lib/apiClient";
import { maskTail } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/field";

const advance = (
  id: string,
  body: { stage_code?: string; response_text?: string; amount_approved?: string },
) => api<ClaimDetail>("POST", `/admin/mock-insurer/${id}/advance`, body);

function Row({ claim }: { claim: Claim }) {
  const { t } = useTranslation("mockInsurer");
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const move = useMutation({
    mutationFn: (b: Parameters<typeof advance>[1]) => advance(claim.id, b),
    onSuccess: () => void qc.invalidateQueries(),
  });
  return (
    <li className="space-y-2 border-t border-ink/10 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <b>{String(claim.incident.patient ?? claim.incident.crop ?? "")}</b>
        <span className="text-caption">{maskTail(claim.policy_no)}</span>
        <StatusChip stage={claim.current_stage} isOverdue={claim.is_overdue} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Input
          aria-label={t("response")}
          placeholder={t("response")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Input
          aria-label={t("amount")}
          placeholder={t("amount")}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="solid"
          isBusy={move.isPending}
          onClick={() =>
            move.mutate({ response_text: text || undefined, amount_approved: amount || undefined })
          }
        >
          {t("advance")}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            move.mutate({ stage_code: "query_raised", response_text: text || t("defaultQuery") })
          }
        >
          {t("raiseQuery")}
        </Button>
      </div>
    </li>
  );
}

export function MockInsurerPage() {
  const { t } = useTranslation("mockInsurer");
  const lists = useQueries({
    queries: TRACKS.map((track) => ({
      queryKey: ["claims", track],
      queryFn: () => api<Claim[]>("GET", `/claims?track=${track}`),
    })),
  });
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4" data-track="health">
      <h1 className="text-3xl font-extrabold text-on-dominant">{t("title")}</h1>
      <p className="text-caption-on-dominant">{t("note")}</p>
      {TRACKS.map((track, i) => (
        <Card key={track} data-track={track}>
          <h2 className="text-xl font-bold">{t(`track.${track}`)}</h2>
          <ul>
            {lists[i]?.data
              ?.filter((c) => c.status !== "draft")
              .map((c) => (
                <Row key={c.id} claim={c} />
              ))}
          </ul>
        </Card>
      ))}
    </main>
  );
}
