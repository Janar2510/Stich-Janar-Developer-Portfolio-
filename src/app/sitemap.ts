import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, localeUrl } from "@/lib/site";
import { getAllPostSlugs } from "@/lib/blog";

const routes = [
  "",
  "/about",
  "/services",
  "/services/kodulehe-tegemine",
  "/services/veebirakendused",
  "/services/mobiilirakendused",
  "/services/ai-arendus",
  "/portfolio",
  "/tools",
  "/roi-calculator",
  "/ai-assessment",
  "/contact",
  "/privacy",
  "/blog",
];

function priorityFor(route: string): number {
  if (route === "") return 1;
  if (route === "/privacy") return 0.3;
  if (route.startsWith("/services/")) return 0.8;
  return 0.7;
}

function changeFrequencyFor(route: string): "weekly" | "monthly" | "yearly" {
  if (route === "") return "weekly";
  if (route === "/privacy") return "yearly";
  return "monthly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Every language version gets its own <url> entry carrying the full alternate
  // set — listing only the default locale hides the other locale from Google.
  const staticEntries: MetadataRoute.Sitemap = routes.flatMap((route) =>
    locales.map((lang) => ({
      url: localeUrl(lang, route),
      lastModified,
      changeFrequency: changeFrequencyFor(route),
      priority: priorityFor(route),
      alternates: { languages: languageAlternates(route) },
    })),
  );

  const postEntries: MetadataRoute.Sitemap = getAllPostSlugs().flatMap((slug) =>
    locales.map((lang) => ({
      url: localeUrl(lang, `/blog/${slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(`/blog/${slug}`) },
    })),
  );

  return [...staticEntries, ...postEntries];
}
