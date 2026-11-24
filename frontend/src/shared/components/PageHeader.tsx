import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/** Title band on the dominant colour (the 60%). */
export function PageHeader({
  title,
  subtitle,
  backTo,
  action,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-2">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-2 inline-flex min-h-tap items-center gap-1.5 text-sm font-medium text-on-dominant"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t("action.back")}
          </Link>
        )}
        <h1 className="text-3xl font-extrabold text-on-dominant sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-caption-on-dominant">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
