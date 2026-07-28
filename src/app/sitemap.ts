import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";
import { getAllPostSlugs } from "@/lib/blog";

const BASE_URL = "https://janarkuusk.com";

const routes = ["", "/about", "/services", "/portfolio", "/tools", "/roi-calculator", "/ai-assessment", "/contact", "/privacy", "/blog"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}/${defaultLocale}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : route === "/privacy" ? "yearly" : "monthly",
    priority: route === "" ? 1 : route === "/privacy" ? 0.3 : 0.7,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${route}`])),
    },
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPostSlugs().map((slug) => ({
    url: `${BASE_URL}/${defaultLocale}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])),
    },
  }));

  return [...staticEntries, ...postEntries];
}
