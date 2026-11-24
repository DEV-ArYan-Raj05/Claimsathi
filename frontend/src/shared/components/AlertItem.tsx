/**
 * One missing-document / failed-check alert (PRD §3.3 Alert UX): what's wrong, on which
 * document (thumbnail with the region marked), and how to fix it. Critical = accent.
 */
import type { ReactNode } from "react";
import { AlertTriangle, FileImage, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Severity } from "../api/contract";
import { cn } from "../lib/cn";

interface AlertItemProps {
  severity: Severity | "missing";
  title: string;
  fix: string;
  documentName?: string;
  bbox?: [number, number, number, number] | null;
  overriddenReason?: string | null;
  actions?: ReactNode;
}

function Thumb({ bbox }: { bbox: [number, number, number, number] | null | undefined }) {
  return (
    <div
      aria-hidden
      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-ink/15 bg-secondary"
    >
      <FileImage className="absolute left-1/2 top-3 h-6 w-6 -translate-x-1/2 text-ink/30" />
      <div className="absolute inset-x-2 top-11 space-y-1">
        <div className="h-1 rounded bg-ink/15" />
        <div className="h-1 w-3/4 rounded bg-ink/15" />
      </div>
      {bbox && (
        <span
          className="absolute rounded-sm border-2 border-accent"
          style={{
            left: `${bbox[0] * 100}%`,
            top: `${bbox[1] * 100}%`,
            width: `${bbox[2] * 100}%`,
            height: `${bbox[3] * 100}%`,
          }}
        />
      )}
    </div>
  );
}

export function AlertItem({
  severity,
  title,
  fix,
  documentName,
  bbox,
  overriddenReason,
  actions,
}: AlertItemProps) {
  const { t } = useTranslation();
  const isBlocking = (severity === "critical" || severity === "missing") && !overriddenReason;
  const Icon = isBlocking ? AlertTriangle : Info;
  return (
    <li
      className={cn(
        "flex gap-4 rounded-2xl bg-secondary p-4 text-ink",
        isBlocking && "border-l-[6px] border-accent",
      )}
    >
      {documentName ? <Thumb bbox={bbox} /> : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium",
              isBlocking ? "bg-accent text-on-accent" : "bg-ink/10",
            )}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {t(`severity.${severity}`)}
          </span>
          {documentName && <span className="truncate text-sm text-caption">{documentName}</span>}
        </div>
        <p className="mt-2 text-base font-bold">{title}</p>
        <p className="mt-0.5 text-base">{fix}</p>
        {overriddenReason && (
          <p className="mt-1 text-sm text-caption">
            {t("alerts.overridden", { reason: overriddenReason })}
          </p>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </li>
  );
}
