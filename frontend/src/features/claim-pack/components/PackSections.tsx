/** Letter preview (EN/HI), form fields, bill summary and enclosures for x-07. */
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClaimPack } from "@/shared/api/contract";
import { LANGUAGES, type Language } from "@/shared/config/app";
import { useLang } from "@/shared/hooks/useLang";
import { formatDate, formatMoney, toPaise } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";

export function LetterPreview({ pack }: { pack: ClaimPack }) {
  const { t } = useTranslation("claimPack");
  const { lang } = useLang();
  const [letterLang, setLetterLang] = useState<Language>(lang);
  return (
    <Card className="print:bg-transparent print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h2 className="text-xl font-bold">{t("letter.title")}</h2>
        <div
          role="radiogroup"
          aria-label={t("letter.language")}
          className="flex rounded-full bg-ink/10 p-1"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={letterLang === l}
              onClick={() => setLetterLang(l)}
              lang={l}
              className={cn(
                "min-h-[40px] rounded-full px-4 text-sm font-medium",
                letterLang === l && "bg-secondary",
              )}
            >
              {t(`letter.lang.${l}`)}
            </button>
          ))}
        </div>
      </div>
      <div
        lang={letterLang}
        className="mt-4 whitespace-pre-wrap rounded-xl bg-ink/5 p-5 text-base leading-relaxed print:bg-transparent"
      >
        {pack.letter[letterLang]}
      </div>
    </Card>
  );
}

export function BillTable({ pack }: { pack: ClaimPack }) {
  const { t } = useTranslation("claimPack");
  const { lang } = useLang();
  return (
    <Card>
      <h2 className="text-xl font-bold">{t("bills.title")}</h2>
      {pack.bills.length === 0 ? (
        <p className="mt-2 text-caption">{t("bills.none")}</p>
      ) : (
        <table className="mt-3 w-full text-left text-base">
          <thead className="text-sm text-caption">
            <tr>
              <th className="py-2 font-medium">{t("bills.provider")}</th>
              <th className="font-medium">{t("bills.date")}</th>
              <th className="text-right font-medium">{t("bills.amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {pack.bills.map((b) => (
              <tr key={b.document_id}>
                <td className="py-2">
                  {b.provider}
                  <span className="block text-sm text-caption">
                    {t("bills.no", { no: b.bill_no })}
                  </span>
                </td>
                <td>{formatDate(b.date, lang)}</td>
                <td className="text-right tabular-nums">{formatMoney(toPaise(b.amount), lang)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/30 font-bold">
              <td className="py-2" colSpan={2}>
                {t("bills.total")}
              </td>
              <td className="text-right text-xl tabular-nums">
                {formatMoney(toPaise(pack.total_claimed), lang)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </Card>
  );
}

export function FormFieldsCard({ pack }: { pack: ClaimPack }) {
  const { t } = useTranslation("claimPack");
  return (
    <Card>
      <h2 className="text-xl font-bold">{t("form.title")}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
        {Object.entries(pack.form_fields).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-caption">{t(`form.field.${k}`, { defaultValue: k })}</dt>
            <dd className="break-words">{v === "yes" || v === "no" ? t(`form.value.${v}`) : v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function Enclosures({ pack }: { pack: ClaimPack }) {
  const { t } = useTranslation("documents");
  const { t: tp } = useTranslation("claimPack");
  return (
    <Card>
      <h2 className="text-xl font-bold">{tp("enclosures.title")}</h2>
      <ul className="mt-3 space-y-2">
        {pack.enclosures.map((e) => (
          <li key={e.code} className="flex items-center gap-2">
            {e.is_ticked ? (
              <CheckCircle2 aria-hidden className="h-5 w-5 text-success" />
            ) : (
              <Circle aria-hidden className="h-5 w-5 text-ink/40" />
            )}
            <span>{t(`item.${e.code}`)}</span>
            <span className="sr-only">
              {e.is_ticked ? tp("enclosures.attached") : tp("enclosures.missing")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
