import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Marquee from "@/components/Marquee";
import Reveal, { StaggerReveal, StaggerItem, ClipReveal } from "@/components/Reveal";
import StatsSection from "@/components/StatsCounter";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import { getDictionary } from "@/i18n/get-dictionary";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeUrl, languageAlternates } from "@/lib/site";

const PROJECT_IMAGES: Record<string, string> = {
  "pocket-negotiator": "/images/project-axis-mobile.jpg",
  "kuus-disain": "/images/project-kuusdisain.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.pages.home;

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: localeUrl(lang),
      languages: languageAlternates(),
    },
  };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.home;

  return (
    <>
      {/* ── HERO ──────────────────────────────── */}
      <HeroSection lang={lang} dict={t.hero} />

      {/* ── MARQUEE ───────────────────────────── */}
      <Marquee items={dict.marquee.items} />

      {/* ── SELECTED WORK ─────────────────────── */}
      <section className="py-40 px-8 bg-black">
        <div className="max-w-[1440px] mx-auto">

          <Reveal className="flex justify-between items-end mb-20">
            <div>
              <div className="lbl text-accent mb-4">{t.featuredWork.badge}</div>
              <h2 className="font-manrope font-bold text-4xl md:text-5xl uppercase tracking-tight text-white">
                {t.featuredWork.heading}
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="arch-line w-32" />
              <Link href={`/${lang}/portfolio`} className="lbl text-zinc-400 hover:text-accent transition-colors flex items-center gap-2">
                {t.featuredWork.viewAll} <span className="material-symbols-outlined text-base">north_east</span>
              </Link>
            </div>
          </Reveal>

          {/* Staggered project cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24">
            {t.projects.map(({ slug, title, category, year }, idx) => {
              const offset = idx === 1;
              return (
                <Reveal key={slug} delay={offset ? 0.12 : 0} className={offset ? "md:mt-40" : ""}>
                  <Link href={`/${lang}/portfolio`} className="group proj-card block">
                    <ClipReveal delay={offset ? 0.12 : 0} className="aspect-[4/5] overflow-hidden ghost mb-8 relative">
                      <Image
                        className="proj-img object-cover"
                        src={PROJECT_IMAGES[slug]}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="lbl text-zinc-500 bg-black/70 px-3 py-1.5">{category}</span>
                      </div>
                    </ClipReveal>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-manrope font-bold text-2xl text-white uppercase tracking-tight mb-2">{title}</h3>
                        <p className="lbl text-zinc-600">{category} · {year}</p>
                      </div>
                      <span className="material-symbols-outlined text-zinc-700 group-hover:text-accent transition-colors mt-1">
                        arrow_outward
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}

            {/* Featured AI project — full width */}
            <Reveal className="md:col-span-2">
              <div className="ghost hover:border-accent transition-colors duration-500 grid md:grid-cols-2 group proj-card">
                {/* object-contain, not cover: this is a composed 1200x630
                    mockup and the column is ~1.48:1, so cover was shearing the
                    Kingspan branding off the left edge. */}
                <div className="w-full aspect-video md:aspect-auto overflow-hidden relative min-h-[300px] bg-black">
                  <Image
                    className="proj-img object-contain"
                    src="/images/project-biopuhastid.jpg"
                    alt={t.featuredAi.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-10 md:p-16 flex flex-col justify-center">
                  <div className="lbl text-accent mb-4">{t.featuredAi.tag}</div>
                  <h3 className="font-manrope font-black text-2xl sm:text-3xl xl:text-4xl text-white uppercase tracking-tight mb-6 leading-tight">
                    {t.featuredAi.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed mb-8">
                    {t.featuredAi.body}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-10">
                    {["VITE", "REACT 18", "TYPESCRIPT", "TAILWIND", "I18NEXT"].map((tag) => (
                      <span key={tag} className="ghost lbl text-zinc-500 px-3 py-2">{tag}</span>
                    ))}
                  </div>
                  <Link href={`/${lang}/portfolio`} className="lbl text-white hover:text-accent transition-colors flex items-center gap-2 self-start">
                    {t.featuredAi.cta} <span className="material-symbols-outlined text-base">north_east</span>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────── */}
      <StatsSection items={dict.stats.items} />

      {/* ── CAPABILITIES ─────────────────────── */}
      <section className="py-40 px-8 bg-zinc-950">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-12 gap-8 mb-20">
            <Reveal className="md:col-span-5">
              <div className="lbl text-accent mb-4">{t.capabilities.badge}</div>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl xl:text-5xl uppercase tracking-tight text-white leading-tight">
                {t.capabilities.headingLine1}<br />{t.capabilities.headingLine2}
              </h2>
            </Reveal>
            <Reveal delay={0.15} className="md:col-span-7 flex items-end">
              <p className="text-zinc-500 text-lg leading-relaxed max-w-xl">
                {t.capabilities.intro}
              </p>
            </Reveal>
          </div>

          <StaggerReveal className="grid md:grid-cols-2 gap-px bg-zinc-900">
            {t.capabilities.items.map(({ icon, title, body }) => (
              <StaggerItem key={title}>
                <div className="p-12 bg-black hover:bg-zinc-950 transition-colors group h-full">
                  <span className="material-symbols-outlined text-4xl text-accent mb-8 block">{icon}</span>
                  <h3 className="font-manrope font-bold text-xl uppercase text-white mb-4">{title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">{body}</p>
                  <div className="arch-line mt-8 group-hover:bg-accent transition-colors duration-300" />
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>

          <Reveal className="mt-12 flex justify-end">
            <Link href={`/${lang}/services`} className="press ghost px-8 py-4 lbl text-white hover:bg-accent hover:border-accent flex items-center gap-3">
              {t.capabilities.viewAllServices} <span className="material-symbols-outlined text-base">north_east</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS (renders nothing until real quotes exist) ── */}
      <Testimonials
        badge={t.testimonials.badge}
        heading={t.testimonials.heading}
        items={t.testimonials.items}
      />

      {/* ── CTA ───────────────────────────────── */}
      <section className="py-60 px-8 bg-black relative overflow-hidden">
        <Reveal className="max-w-[1440px] mx-auto text-center relative z-10">
          <div className="lbl text-zinc-700 mb-8">{t.cta.badge}</div>
          <h2 className="font-manrope font-black text-4xl md:text-6xl uppercase tracking-tight text-white mb-6">
            {t.cta.heading}
          </h2>
          <p className="text-zinc-500 text-lg max-w-md mx-auto mb-14">
            {t.cta.bodyLine1}<br />{t.cta.bodyLine2}
          </p>
          <Link
            href={`/${lang}/contact`}
            className="press inline-block bg-accent text-white font-manrope font-bold py-5 px-16 text-sm tracking-widest hover:bg-white hover:text-black"
          >
            {t.cta.button}
          </Link>
        </Reveal>
        {/* Watermark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden="true"
          style={{ opacity: 0.025 }}
        >
          <span className="font-manrope font-black text-white leading-none whitespace-nowrap" style={{ fontSize: "18vw" }}>
            {t.cta.watermark}
          </span>
        </div>
      </section>
    </>
  );
}
