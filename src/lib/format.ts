import type { Locale } from "@/i18n/config";

// EUR everywhere — locale only changes the digit grouping/decimal style
// (e.g. et-EE renders "1 234,56 €", en-US renders "€1,234.56").
const INTL_LOCALE: Record<Locale, string> = {
  et: "et-EE",
  en: "en-US",
};

export function formatCurrency(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number, decimals = 1): string {
  return Number.isFinite(value) ? `${value.toFixed(decimals)}%` : "∞";
}

export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(date);
}
