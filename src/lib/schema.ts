// Structured data for the site, built as one linked @graph rather than a set of
// unrelated blobs — Google resolves `@id` references, so the business, the person
// behind it, and the service catalogue read as a single entity instead of three.
//
// Rule for this file: every value here must be verifiable from the site, from the
// dictionaries, or confirmed directly by Janar. Nothing invented — a wrong fact in
// structured data is worse than a missing one. Keep it in step with the Google
// Business Profile; contradicting the profile is worse than saying less.
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { SITE_URL, localeUrl } from "@/lib/site";

const BUSINESS_ID = `${SITE_URL}/#business`;
const PERSON_ID = `${SITE_URL}/#janar-kuusk`;

const EMAIL = "info@janarkuuskpro.com";
const TELEPHONE = "+37256103001";
const FOUNDING_YEAR = "2022"; // "EST. 2022" on the services page
const PROFILES = [
  "https://www.linkedin.com/in/janar-kuusk-15528b1a0",
  "https://github.com/Janar2510",
];

// Based in Tartu. No street address is asserted — this is a service-area
// practice, and Google treats an unverified street address as a liability.
const ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Tartu",
  addressCountry: "EE",
} as const;

// Weekdays confirmed by Janar. The 09:00–17:00 window is an assumption — swap it
// for the real hours and keep this in step with the Business Profile.
const OPENING_HOURS = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "09:00",
  closes: "17:00",
} as const;

const AREA_SERVED = [
  { "@type": "Country", name: "Estonia" },
  { "@type": "Place", name: "European Union" },
  { "@type": "Country", name: "United States" },
] as const;

// Only website work has a published entry price. Keyed off the item's `n` field
// so reordering the services list cannot silently attach it to the wrong one.
const MIN_PRICE_EUR: Record<string, number> = { "(01)": 500 };

export function buildSiteSchema(lang: Locale, dict: Dictionary) {
  const url = localeUrl(lang);

  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Janar Kuusk",
    jobTitle: "Developer, Designer, AI Engineer",
    url: SITE_URL,
    email: EMAIL,
    telephone: TELEPHONE,
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
    telephone: TELEPHONE,
    image: `${SITE_URL}/janar-hero.png`,
    logo: `${SITE_URL}/images/Logo/wordmark.png`,
    address: ADDRESS,
    areaServed: AREA_SERVED,
    availableLanguage: ["et", "en"],
    openingHoursSpecification: OPENING_HOURS,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    foundingDate: FOUNDING_YEAR,
    founder: { "@id": PERSON_ID },
    sameAs: PROFILES,
    hasOfferCatalog: {
      // No `name` — the only catalogue label available is nav copy, which is
      // uppercased for the UI and would read as shouting in structured data.
      "@type": "OfferCatalog",
      itemListElement: dict.services.items.map((item) => {
        const minPrice = MIN_PRICE_EUR[item.n];
        return {
          "@type": "Offer",
          ...(minPrice !== undefined && {
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice,
              priceCurrency: "EUR",
            },
          }),
          itemOffered: {
            "@type": "Service",
            name: item.schemaName,
            description: item.body,
            provider: { "@id": BUSINESS_ID },
          },
        };
      }),
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [business, person],
  };
}
