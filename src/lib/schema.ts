// Structured data for the site, built as one linked @graph rather than a set of
// unrelated blobs — Google resolves `@id` references, so the business, the person
// behind it, and the service catalogue read as a single entity instead of three.
//
// Rule for this file: every value here must be verifiable from the site itself or
// from the dictionaries. No invented addresses, phone numbers, opening hours, or
// price ranges — a wrong fact in structured data is worse than a missing one.
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { SITE_URL, localeUrl } from "@/lib/site";

const BUSINESS_ID = `${SITE_URL}/#business`;
const PERSON_ID = `${SITE_URL}/#janar-kuusk`;

const EMAIL = "info@janarkuuskpro.com";
const FOUNDING_YEAR = "2022"; // "EST. 2022" on the services page
const PROFILES = [
  "https://www.linkedin.com/in/janar-kuusk-15528b1a0",
  "https://github.com/Janar2510",
];

// Tartu, Estonia is stated across the site. There is no street address or phone
// number anywhere in the codebase, so neither is asserted here.
const ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Tartu",
  addressCountry: "EE",
} as const;

export function buildSiteSchema(lang: Locale, dict: Dictionary) {
  const url = localeUrl(lang);

  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Janar Kuusk",
    jobTitle: "Developer, Designer, AI Engineer",
    url: SITE_URL,
    email: EMAIL,
    image: `${SITE_URL}/janar-hero.png`,
    address: ADDRESS,
    sameAs: PROFILES,
    knowsLanguage: ["et", "en"],
    worksFor: { "@id": BUSINESS_ID },
  };

  // ProfessionalService rather than a bare LocalBusiness: this is a service
  // practice reached online, not a storefront with walk-in hours.
  const business = {
    "@type": "ProfessionalService",
    "@id": BUSINESS_ID,
    name: "Janar Kuusk",
    url,
    description: dict.seo.site.description,
    email: EMAIL,
    image: `${SITE_URL}/janar-hero.png`,
    address: ADDRESS,
    areaServed: { "@type": "Country", name: "Estonia" },
    availableLanguage: ["et", "en"],
    foundingDate: FOUNDING_YEAR,
    founder: { "@id": PERSON_ID },
    sameAs: PROFILES,
    hasOfferCatalog: {
      // No `name` — the only catalogue label available is nav copy, which is
      // uppercased for the UI and would read as shouting in structured data.
      "@type": "OfferCatalog",
      itemListElement: dict.services.items.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: item.schemaName,
          description: item.body,
          provider: { "@id": BUSINESS_ID },
        },
      })),
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [business, person],
  };
}
