import type { Metadata } from "next";
import Link from "next/link";
import { StaggerReveal, StaggerItem } from "@/components/Reveal";
import HeroVideoBg from "@/components/HeroVideoBg";
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
  const seo = dict.seo.pages.tools;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/tools`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/tools`])),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.tools;

  return (
    <div>

      {/* ── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0D0D0D] pt-36 pb-20 md:pt-48 md:pb-28">
        <HeroVideoBg />

        <div className="relative z-10 max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <div>
              <span className="lbl text-accent block mb-6 hi">{t.hero.badge}</span>
              <h1 className="font-manrope font-black text-[11vw] sm:text-6xl md:text-8xl uppercase tracking-tight text-white leading-none hi-mask">
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

      {/* ── TOOLS GRID ──────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-40">
        <StaggerReveal className="grid md:grid-cols-2 gap-8">
          {t.items.map((item) => (
            <StaggerItem key={item.href}>
              <Link href={`/${lang}${item.href}`} className="group proj-card ghost hover:border-accent transition-colors duration-500 p-10 md:p-14 flex flex-col h-full">
                <span className="material-symbols-outlined text-4xl text-accent mb-10 block">{item.icon}</span>
                <span className="lbl text-zinc-600 mb-4 block">{item.tag}</span>
                <h2 className="font-manrope font-bold text-3xl text-white uppercase tracking-tight mb-5">{item.title}</h2>
                <p className="text-zinc-500 leading-relaxed text-sm mb-10 flex-1">{item.body}</p>
                <span className="lbl text-white group-hover:text-accent transition-colors flex items-center gap-2">
                  {t.openTool} <span className="material-symbols-outlined text-base">north_east</span>
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>

    </div>
  );
}
