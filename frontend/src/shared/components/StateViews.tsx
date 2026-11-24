/** Empty / error / offline states shared by every screen (PRD §4.3). */
import type { ReactNode } from "react";
import { CloudOff, FileSearch, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnline } from "../hooks/useOnline";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <FileSearch aria-hidden className="h-12 w-12 text-ink/40" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-caption">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const { t } = useTranslation();
  const isOnline = useOnline();
  return (
    <Card role="alert" className="flex flex-col items-start gap-3">
      <h2 className="text-lg font-bold">
        {isOnline ? t("state.errorTitle") : t("state.offlineTitle")}
      </h2>
      <p className="text-caption">
        {message ?? (isOnline ? t("state.errorBody") : t("state.offlineBody"))}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw aria-hidden className="h-4 w-4" />
        {t("action.retry")}
      </Button>
    </Card>
  );
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnline();
  if (isOnline) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-ink px-4 py-2 text-sm text-secondary">
      <CloudOff aria-hidden className="h-4 w-4" />
      {t("state.offlineBanner")}
    </div>
  );
}
