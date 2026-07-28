import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import HeroVideoBg from "@/components/HeroVideoBg";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";

const BASE_URL = "https://janarkuusk.com";

const SERVICE_IMAGES = ["/images/service-design.jpg", "/images/service-webapp.jpg", "/images/service-mobile.jpg", "/images/service-ai.jpg"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.pages.services;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/services`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/services`])),
    },
  };
}

export default async function Services({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.services;

  return (
    <div>

      {/* ── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0D0D0D] pt-36 pb-20 md:pt-48 md:pb-28">
        <HeroVideoBg />

        <div className="relative z-10 max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12">
            <div className="max-w-3xl">
              <span className="lbl text-accent block mb-6 hi">{t.hero.badge}</span>
              <h1 className="font-manrope font-bold text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight text-white leading-none hi-mask">
                {t.hero.headingLine1}<br />{t.hero.headingLine2}<br />{t.hero.headingLine3}
              </h1>
            </div>
            <div className="text-right hidden lg:block hi-d2">
              <span className="lbl text-zinc-400 block">{t.hero.est}</span>
              <span className="lbl text-zinc-400 block mt-1">{t.hero.location}</span>
            </div>
          </div>
          <div className="arch-line mt-16 md:mt-20" />
        </div>
      </section>

      {/* Intro */}
      <Reveal className="max-w-[1440px] mx-auto px-8 pb-20">
        <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl">
          {t.intro}
        </p>
      </Reveal>

      {/* ── SERVICE BLOCKS ────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pb-40 space-y-40">
        {t.items.map(({ n, titleLine1, titleLine2, body, tools, cta }, idx) => {
          const imageRight = idx % 2 === 0;
          const accent = idx === 3;
          const image = SERVICE_IMAGES[idx];
          const title = `${titleLine1} ${titleLine2}`;
          return (
            <div key={n}>
              <Reveal>
                <div className={`grid grid-cols-12 gap-8 service-block ${imageRight ? "" : "flex-row-reverse"}`}>
                  {/* Number */}
                  <div className="col-span-12 md:col-span-1 order-1">
                    <span className={`font-manrope font-black text-2xl ${accent ? "text-accent" : "text-zinc-800"}`}>{n}</span>
                  </div>

                  {/* Text — always on right side of number, or left of image depending on imageRight */}
                  <div className={`col-span-12 md:col-span-5 flex flex-col justify-center ${imageRight ? "order-2" : "order-3"}`}>
                    {accent && <div className="lbl text-accent mb-4">{t.aiLlmBadge}</div>}
                    <h2 className="font-manrope font-bold text-4xl md:text-5xl text-white uppercase tracking-tight mb-8 whitespace-pre-line">
                      {titleLine1}
                      <br />
                      {titleLine2}
                    </h2>
                    <p className="text-zinc-400 leading-relaxed mb-10">{body}</p>
                    <div className="flex flex-wrap gap-3">
                      {tools.map((tool) => (
                        <span key={tool} className="ghost lbl text-zinc-500 px-4 py-2 hover:text-accent transition-colors">{tool}</span>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className={`col-span-12 md:col-span-6 relative overflow-hidden h-[480px] ${imageRight ? "order-3" : "order-2"}`}>
                    {accent && (
                      <div className="absolute top-8 left-8 z-10">
                        <span className="ai-badge lbl px-4 py-2">{t.newServiceBadge}</span>
                      </div>
                    )}
                    <Image
                      className="service-img object-cover"
                      src={image}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                    {cta && (
                      <div className={`absolute bottom-8 ${imageRight ? "left-8" : "right-8"}`}>
                        <Link
                          href={`/${lang}/contact`}
                          className="press ghost bg-black/50 backdrop-blur-md text-white px-6 py-3 lbl flex items-center gap-3 hover:bg-accent hover:border-accent"
                        >
                          {cta} <span className="material-symbols-outlined text-base">north_east</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
              {idx < t.items.length - 1 && <div className="arch-line mt-40" />}
            </div>
          );
        })}
      </section>

      {/* ── MARQUEE ───────────────────────────── */}
      <Marquee items={dict.marquee.items} />

      {/* ── CTA ───────────────────────────────── */}
      <section className="bg-zinc-950 py-40 border-b border-zinc-900 overflow-hidden relative">
        <Reveal className="max-w-[1440px] mx-auto px-8 relative z-10 flex flex-col items-center text-center">
          <h2 className="font-manrope font-bold text-5xl md:text-6xl uppercase tracking-tight text-white mb-14">
            {t.cta.headingLine1}<br />{t.cta.headingLine2}
          </h2>
          <Link
            href={`/${lang}/contact`}
            className="press bg-accent text-white font-manrope font-bold px-14 py-6 text-sm tracking-widest hover:bg-white hover:text-black"
          >
            {t.cta.button}
          </Link>
        </Reveal>
        <div className="absolute top-0 right-0 p-12 pointer-events-none select-none" aria-hidden="true" style={{ opacity: 0.035 }}>
          <span className="font-manrope font-black text-white leading-none block" style={{ fontSize: "14vw" }}>{t.watermarkLine1}</span>
          <span className="font-manrope font-black text-white leading-none block ml-16" style={{ fontSize: "14vw" }}>{t.watermarkLine2}</span>
        </div>
      </section>

    </div>
  );
}
