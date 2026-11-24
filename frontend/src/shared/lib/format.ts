/**
 * Money and date formatting. Money is held as integer paise in the client so sums are exact
 * (rules.md §2.6 — totals in code, never by an LLM). Display timezone is Asia/Kolkata.
 */
import type { Language } from "../config/app";

const TZ = "Asia/Kolkata";
const LOCALE: Record<Language, string> = { en: "en-IN", hi: "hi-IN" };

/** Parse "1234.50" / 1234.5 into integer paise without float drift. */
export function toPaise(value: string | number): number {
  const text = typeof value === "number" ? value.toFixed(2) : value.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new Error(`Not a money value: ${text}`);
  const [, sign, rupees, fraction = ""] = match;
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return sign === "-" ? -paise : paise;
}

/** Sum money values exactly. */
export function sumPaise(values: readonly (string | number)[]): number {
  return values.reduce<number>((acc, v) => acc + toPaise(v), 0);
}

/** ₹1,00,000 style (Indian digit grouping); drops ".00". */
export function formatMoney(paise: number, lang: Language = "en"): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** 24 Nov 2026 */
export function formatDate(iso: string, lang: Language = "en"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** 24 Nov, 3:40 pm */
export function formatDateTime(iso: string, lang: Language = "en"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "••••1234" — policy and account numbers are never shown in full outside the PDF. */
export function maskTail(value: string, visible = 4): string {
  const tail = value.replace(/\s/g, "").slice(-visible);
  return `••••${tail}`;
}

/** Whole hours and minutes left until `iso` (negative when passed). */
export function timeLeft(
  iso: string,
  now: number = Date.now(),
): { hours: number; minutes: number; isOverdue: boolean } {
  const diffMin = Math.floor((new Date(iso).getTime() - now) / 60000);
  const abs = Math.abs(diffMin);
  return { hours: Math.floor(abs / 60), minutes: abs % 60, isOverdue: diffMin < 0 };
}

/** Add hours / days to an ISO timestamp (deadline maths stays in code). */
export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return addHours(iso, days * 24);
}
