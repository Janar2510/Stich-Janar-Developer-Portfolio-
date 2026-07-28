// Single source of truth for supported locales. Import this everywhere —
// never redeclare a literal locale array/type in another file.
export const locales = ["et", "en"] as const;
export const defaultLocale: Locale = "et";

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
