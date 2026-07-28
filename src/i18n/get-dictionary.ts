import "server-only";
import type { Locale } from "./config";

// Typed off the Estonian dictionary (the primary/source-of-truth locale) —
// every other dictionary must satisfy this shape. No `any` anywhere.
export type Dictionary = typeof import("./dictionaries/et.json");

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  et: () => import("./dictionaries/et.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const loader = dictionaries[locale];
  // Estonian is primary — fall back to it, not English, if a locale is ever missing.
  return (loader ?? dictionaries.et)();
};
