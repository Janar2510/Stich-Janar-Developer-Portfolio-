// Single source of truth for this site's public origin. Import this everywhere —
// never hardcode the domain in a page, sitemap, or JSON-LD block.
//
// The apex (janarkuuskpro.com) 308-redirects to www, so www is the canonical
// host. Anything that ships a URL to Google must be built from here.
import { locales, defaultLocale, type Locale } from "@/i18n/config";

export const SITE_URL = "https://www.janarkuuskpro.com";

/** Absolute URL for a locale-prefixed route. `path` starts with "/" or is empty. */
export function localeUrl(lang: Locale, path = ""): string {
  return `${SITE_URL}/${lang}${path}`;
}

/** hreflang map for a route, including x-default pointing at the default locale. */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localeUrl(locale, path)])),
    "x-default": localeUrl(defaultLocale, path),
  };
}
