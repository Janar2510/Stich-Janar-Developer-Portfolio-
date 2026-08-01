import type { Metadata } from "next";
import AiAssessment from "./AiAssessment";
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
  const seo = dict.seo.pages.aiAssessment;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: localeUrl(lang, "/ai-assessment"),
      languages: languageAlternates("/ai-assessment"),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  return <AiAssessment lang={lang} dict={dict.aiAssessment} />;
}
