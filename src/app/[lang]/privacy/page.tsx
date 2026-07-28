import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";

const BASE_URL = "https://janarkuusk.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.pages.privacy;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/privacy`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/privacy`])),
    },
    robots: { index: true, follow: true },
  };
}

export default async function Privacy({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.privacy;

  return (
    <div className="pt-32">
      <section className="max-w-[900px] mx-auto px-8 pt-20 pb-16">
        <Reveal>
          <div className="lbl text-accent mb-6 hi">{t.badge}</div>
          <h1 className="font-manrope font-black text-4xl md:text-6xl uppercase tracking-tight text-white leading-none mb-6 hi-mask break-words">
            {t.heading}
          </h1>
          <p className="lbl text-zinc-700 mb-8">{t.lastUpdated}</p>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">{t.intro}</p>
        </Reveal>
      </section>

      <div className="max-w-[900px] mx-auto px-8">
        <div className="arch-line" />
      </div>

      <section className="max-w-[900px] mx-auto px-8 py-20">
        <div className="space-y-16">
          {t.sections.map(({ title, body }, i) => (
            <Reveal key={title} delay={Math.min(i * 0.04, 0.3)}>
              <h2 className="font-manrope font-bold text-xl md:text-2xl text-white uppercase tracking-tight mb-4">
                {String(i + 1).padStart(2, "0")} — {title}
              </h2>
              <p className="text-zinc-500 leading-relaxed">{body}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
