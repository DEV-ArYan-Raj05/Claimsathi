/** TopBar, desktop SideNav and mobile BottomNav (PRD §4.2). Voice opens the x-10 sheet. */
import { FileText, Home, Mic, Settings, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { APP_NAME } from "../config/app";
import { useTrack } from "../hooks/useTrack";
import { cn } from "../lib/cn";
import { LanguageToggle } from "./LanguageToggle";
import { TrackSwitcher } from "./TrackSwitcher";

function useItems() {
  const track = useTrack();
  return [
    { to: `/${track}`, key: "home", Icon: Home, end: true },
    { to: `/${track}/policies`, key: "policies", Icon: ShieldCheck, end: false },
    { to: `/${track}/claims`, key: "claims", Icon: FileText, end: false },
  ] as const;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex min-h-tap items-center gap-2 text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg bg-on-dominant text-dominant"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      {APP_NAME}
    </Link>
  );
}

export function TopBar() {
  const { t } = useTranslation();
  return (
    <div className="on-dominant bg-dominant text-on-dominant">
      <div className="mx-auto flex max-w-shell items-center justify-between gap-2 px-4 py-2 lg:px-6">
        <Logo className="hidden sm:inline-flex" />
        <TrackSwitcher />
        <div className="flex items-center">
          <LanguageToggle />
          <NavLink
            to="/settings"
            aria-label={t("nav.settings")}
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full"
          >
            <Settings aria-hidden className="h-5 w-5" />
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export function SideNav({ onVoice }: { onVoice: () => void }) {
  const { t } = useTranslation();
  const items = useItems();
  const link = "flex min-h-tap items-center gap-3 rounded-xl px-4 text-base font-medium";
  return (
    <nav
      aria-label={t("nav.main")}
      className="on-dominant sticky top-20 hidden w-56 shrink-0 self-start lg:block"
    >
      <ul className="space-y-1">
        {items.map(({ to, key, Icon, end }) => (
          <li key={key}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  link,
                  isActive ? "bg-secondary text-ink" : "text-on-dominant hover:bg-on-dominant/10",
                )
              }
            >
              <Icon aria-hidden className="h-5 w-5" />
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onVoice}
            className={cn(link, "w-full text-on-dominant hover:bg-on-dominant/10")}
          >
            <Mic aria-hidden className="h-5 w-5" />
            {t("nav.voice")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function BottomNav({ onVoice }: { onVoice: () => void }) {
  const { t } = useTranslation();
  const items = useItems();
  const cell = "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-sm";
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-secondary text-ink lg:hidden"
    >
      <ul className="flex">
        {items.map(({ to, key, Icon, end }) => (
          <li key={key} className="flex flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => cn(cell, isActive ? "font-bold" : "text-caption")}
            >
              <Icon aria-hidden className="h-5 w-5" />
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <button type="button" onClick={onVoice} className={cn(cell, "text-caption")}>
            <Mic aria-hidden className="h-5 w-5" />
            {t("nav.voice")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
