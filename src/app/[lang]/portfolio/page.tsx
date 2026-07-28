import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import HeroVideoBg from "@/components/HeroVideoBg";
import PortfolioGrid, { type FilterCopy } from "./PortfolioGrid";
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
  const seo = dict.seo.pages.portfolio;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/portfolio`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/portfolio`])),
    },
  };
}

export default async function Portfolio({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.portfolio;

  return (
    <div>

      {/* ── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0D0D0D] pt-36 pb-20 md:pt-48 md:pb-28">
        <HeroVideoBg />

        <div className="relative z-10 max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12">
            <div>
              <span className="lbl text-accent block mb-6 hi">{t.hero.badge}</span>
              <h1 className="font-manrope font-black text-6xl md:text-8xl uppercase tracking-tight text-white leading-none hi-mask">
                {t.hero.headingLine1}<br />{t.hero.headingLine2}
              </h1>
            </div>
            <div className="pb-2 hi-d2">
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xs">
                {t.hero.intro}
              </p>
            </div>
          </div>
          <div className="arch-line mt-16 md:mt-20" />
        </div>
      </section>

      {/* ── PORTFOLIO GRID (client — has filter) ── */}
      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-40">
        <PortfolioGrid projects={t.projects} filters={t.filters as FilterCopy[]} aiProjectBadge={t.aiProjectBadge} />
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 py-40 border-t border-zinc-900">
        <Reveal className="flex flex-col items-center text-center">
          <span className="lbl text-zinc-600 mb-8">{t.cta.label}</span>
          <h2 className="font-manrope font-bold text-5xl md:text-6xl uppercase tracking-tight text-white mb-14">
            {t.cta.headingLine1}<br />
            <span className="text-accent">{t.cta.headingAccent}</span>
          </h2>
          <Link
            href={`/${lang}/contact`}
            className="press bg-white text-black font-manrope font-bold px-14 py-5 text-sm tracking-widest hover:bg-accent hover:text-white"
          >
            {t.cta.button}
          </Link>
        </Reveal>
      </section>

    </div>
  );
}
