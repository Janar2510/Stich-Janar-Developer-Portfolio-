import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ContactForm from "./ContactForm";
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
  const seo = dict.seo.pages.contact;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/contact`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/contact`])),
    },
  };
}

export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.contact;

  return (
    <div className="pt-32 max-w-[1440px] mx-auto px-8">

      {/* ── HERO ──────────────────────────────── */}
      <section className="pt-20 pb-20">
        <span className="lbl text-accent block mb-8 hi">{t.hero.badge}</span>
        <h1 className="font-manrope font-black text-5xl md:text-7xl uppercase tracking-tight text-white leading-tight hi-mask">
          {t.hero.headingLine1}<br />{t.hero.headingLine2}<br />{t.hero.headingLine3}
        </h1>
        <div className="w-16 h-1 bg-accent mt-8 hi-d2" />
      </section>

      {/* ── MAIN GRID ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start pb-40">

        {/* Left — contact details */}
        <Reveal className="lg:col-span-5 flex flex-col gap-10">

          <div className="ghost hover:border-accent transition-colors p-10 flex flex-col gap-3">
            <span className="lbl text-zinc-600">{t.directEmail}</span>
            <a
              href="mailto:info@janarkuuskpro.com"
              className="font-manrope font-bold text-2xl md:text-3xl text-white hover:text-accent transition-colors tracking-tight"
            >
              info@janarkuuskpro.com
            </a>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="ghost hover:border-accent transition-colors p-8 flex-1 group">
              <span className="lbl text-zinc-600 block mb-4">{t.network}</span>
              <Link href="https://www.linkedin.com/in/janar-kuusk-15528b1a0" target="_blank" rel="noopener noreferrer" className="font-manrope font-bold text-xl text-white flex items-center justify-between group-hover:text-accent transition-colors">
                LINKEDIN <span className="material-symbols-outlined">north_east</span>
              </Link>
            </div>
            <div className="ghost p-8 flex-1">
              <span className="lbl text-zinc-600 block mb-4">{t.location}</span>
              <p className="font-manrope font-bold text-xl text-white">{t.locationValueLine1}<br />{t.locationValueLine2}</p>
            </div>
          </div>

          <div className="ghost p-8 flex items-center gap-6">
            <span className="material-symbols-outlined text-accent text-3xl">schedule</span>
            <div>
              <div className="lbl text-zinc-600 mb-1">{t.responseTime}</div>
              <div className="font-manrope font-bold text-white">{t.responseTimeValue}</div>
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden ghost">
            <Image
              className="object-cover grayscale hover:grayscale-0 transition-[filter] duration-700"
              src="/images/contact-tech.jpg"
              alt="Tallinn"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          </div>

        </Reveal>

        {/* Right — form */}
        <Reveal delay={0.15} className="lg:col-span-7">
          <ContactForm dict={t.form} />
        </Reveal>

      </section>

      <div className="arch-line" />

    </div>
  );
}
