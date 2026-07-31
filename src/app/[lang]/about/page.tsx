import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal, { StaggerReveal, StaggerItem } from "@/components/Reveal";
import StatsSection from "@/components/StatsCounter";
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
  const seo = dict.seo.pages.about;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/about`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/about`])),
    },
  };
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.about;
  const developer = dict.home.hero.developer;
  const designer = dict.home.hero.designer;

  return (
    <div className="pt-32">

      {/* ── HERO ──────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pt-20 pb-20">
        <div className="lbl text-accent mb-12 hi">{t.hero.badge}</div>
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-end">

          {/* Name + identity */}
          <div className="md:col-span-5">
            <div className="text-white hi-mask" style={{ fontFamily: "var(--manrope,'Manrope',sans-serif)", fontSize: "clamp(48px,7vw,110px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
              JANAR<br />
              <span className="text-stroke">KUUSK.</span>
            </div>
            <div className="mt-10 space-y-3 hi-d2">
              <div className="font-manrope font-medium text-accent tracking-widest" style={{ fontSize: "clamp(14px,1.8vw,22px)", textTransform: "uppercase" }}>{developer}</div>
              <div className="font-manrope font-medium text-zinc-400 tracking-widest" style={{ fontSize: "clamp(14px,1.8vw,22px)", textTransform: "uppercase" }}>{designer}</div>
              <div className="font-manrope font-medium text-zinc-600 tracking-widest" style={{ fontSize: "clamp(14px,1.8vw,22px)", textTransform: "uppercase" }}>{t.hero.aiEngineer}</div>
            </div>
            <div className="mt-12 hi-d3">
              <div className="arch-line mb-8" />
              <p className="text-zinc-400 leading-relaxed mb-6">
                {t.hero.bio1}
              </p>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {t.hero.bio2}
              </p>
              <div className="mt-10">
                <Link href={`/${lang}/contact`} className="lbl text-white hover:text-accent transition-colors flex items-center gap-3">
                  {t.hero.cta} <span className="material-symbols-outlined text-base">north_east</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Hero photo */}
          <div className="md:col-span-7 hi-d2">
            <div className="relative overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: "80vh" }}>
              <Image
                src="/janar-hero.png"
                alt="Janar Kuusk"
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover object-top"
                priority
              />
              {/* Subtle gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
              {/* Location badge */}
              <div className="absolute bottom-8 left-8">
                <span className="lbl text-zinc-400 bg-black/60 backdrop-blur-sm px-4 py-2 border border-zinc-800">
                  {t.hero.locationBadge}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* px-8 on a wrapper, not mx-8 on the rule itself: .arch-line sets
          width:100%, so a horizontal margin pushed it past the viewport. */}
      <div className="px-8">
        <div className="arch-line" />
      </div>

      {/* ── PHILOSOPHY ────────────────────────── */}
      <section className="py-40 px-8 bg-zinc-950">
        <div className="max-w-[1440px] mx-auto">
          <Reveal>
            <div className="lbl text-zinc-700 mb-12">{t.philosophy.badge}</div>
            <blockquote
              className="text-zinc-200 max-w-5xl"
              style={{ fontFamily: "var(--manrope,'Manrope',sans-serif)", fontSize: "clamp(28px,4.5vw,64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", textTransform: "uppercase" }}
            >
              &quot;{t.philosophy.quoteBefore}{" "}
              <span className="text-accent">{t.philosophy.quoteAccent}</span> {t.philosophy.quoteAfter}&quot;
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────── */}
      <StatsSection items={dict.stats.items} />

      {/* ── TECH STACK ────────────────────────── */}
      <section className="py-40 px-8 bg-zinc-950">
        <div className="max-w-[1440px] mx-auto">
          <Reveal>
            <div className="lbl text-accent mb-4">{t.stack.badge}</div>
            <h2 className="font-manrope font-bold text-4xl md:text-5xl uppercase tracking-tight text-white mb-20">
              {t.stack.heading}
            </h2>
          </Reveal>
          <StaggerReveal className="grid grid-cols-2 md:grid-cols-5 gap-px bg-zinc-900">
            {t.stack.categories.map(({ category, tools }) => (
              <StaggerItem key={category}>
                <div className="bg-black p-8 h-full">
                  <div className="lbl text-accent mb-6">{category}</div>
                  <div className="flex flex-col gap-3">
                    {tools.map((tool) => (
                      <span key={tool} className="ghost lbl text-zinc-400 px-3 py-2 hover:text-accent transition-colors inline-block break-words">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────── */}
      <section className="py-40 px-8 bg-black">
        <div className="max-w-[1440px] mx-auto">
          <Reveal>
            <div className="lbl text-accent mb-4">{t.process.badge}</div>
            <h2 className="font-manrope font-bold text-4xl md:text-5xl uppercase tracking-tight text-white mb-20">
              {t.process.heading}
            </h2>
          </Reveal>
          <div>
            {t.process.steps.map(({ n, title, body }, i) => (
              <Reveal key={n} delay={i * 0.08}>
                {/* 12 columns wait for lg here too: at 768 the gaps leave the title
                    column at 158px, too narrow for "VIIMISTLEMINE". */}
                <div className="process-step grid grid-cols-1 lg:grid-cols-12 gap-6 py-12">
                  <div className="lg:col-span-1">
                    <span className="font-manrope font-black text-3xl text-zinc-800">{n}</span>
                  </div>
                  <div className="lg:col-span-3">
                    <h3 className="font-manrope font-bold text-2xl text-white uppercase tracking-tight">{title}</h3>
                  </div>
                  <div className="lg:col-span-8">
                    <p className="text-zinc-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="py-40 px-8 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-12 gap-12 items-center">
          <Reveal className="md:col-span-7">
            <div className="lbl text-zinc-600 mb-6">{t.cta.badge}</div>
            <h2 className="font-manrope font-black text-5xl md:text-6xl uppercase tracking-tight text-white leading-tight">
              {t.cta.headingLine1}<br />{t.cta.headingLine2}
            </h2>
          </Reveal>
          <Reveal delay={0.2} className="md:col-span-5 flex flex-col gap-6 md:items-end">
            <p className="text-zinc-500 leading-relaxed md:text-right max-w-sm">
              {t.cta.body}
            </p>
            <Link href={`/${lang}/contact`} className="press inline-block bg-accent text-white font-manrope font-bold py-5 px-12 text-sm tracking-widest hover:bg-white hover:text-black">
              {t.cta.button}
            </Link>
            <Link href={`/${lang}/portfolio`} className="lbl text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
              {t.cta.viewWork} <span className="material-symbols-outlined text-base">north_east</span>
            </Link>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
