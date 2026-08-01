import type { Metadata } from "next";
import RoiCalculator from "./RoiCalculator";
import { getDictionary } from "@/i18n/get-dictionary";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeUrl, languageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.pages.roiCalculator;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: localeUrl(lang, "/roi-calculator"),
      languages: languageAlternates("/roi-calculator"),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  return <RoiCalculator lang={lang} dict={dict.roiCalculator} />;
}
