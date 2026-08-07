import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeUrl, languageAlternates } from "@/lib/site";
import { BUSINESS_ID, AREA_SERVED } from "@/lib/schema";

const SLUGS = ["kodulehe-tegemine", "veebirakendused", "mobiilirakendused", "ai-arendus"] as const;
type ServiceSlug = (typeof SLUGS)[number];

function isServiceSlug(value: string): value is ServiceSlug {
  return (SLUGS as readonly string[]).includes(value);
}

export async function generateStaticParams() {
  return locales.flatMap((lang) => SLUGS.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  if (!isServiceSlug(slug)) return {};

  const dict = await getDictionary(lang);
  const page = dict.servicePages[slug];

  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical: localeUrl(lang, `/services/${slug}`),
      languages: languageAlternates(`/services/${slug}`),
    },
    openGraph: {
      type: "website",
      title: page.seo.title,
      description: page.seo.description,
      url: localeUrl(lang, `/services/${slug}`),
    },
  };
}

export default async function ServiceLandingPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  if (!isServiceSlug(slug)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.servicePages[slug];
  const url = localeUrl(lang, `/services/${slug}`);

  // kodulehe-tegemine is the only service with a published entry price — keep
  // this in step with MIN_PRICE_EUR in src/lib/schema.ts.
  const offer =
    slug === "kodulehe-tegemine"
      ? {
          "@type": "Offer",
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: 500,
            priceCurrency: "EUR",
          },
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: page.hero.heading,
        description: page.seo.description,
        url,
        provider: { "@id": BUSINESS_ID },
        areaServed: AREA_SERVED,
        ...(offer && { offers: offer }),
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO ──────────────────────────────── */}
      <section className="pt-36 pb-20 md:pt-48 md:pb-28 px-8 bg-[#0D0D0D]">
        <div className="max-w-[1440px] mx-auto">
          <Reveal>
            <span className="lbl text-accent block mb-6">{page.hero.badge}</span>
            <h1 className="font-manrope font-bold text-[8vw] sm:text-5xl md:text-6xl xl:text-7xl uppercase tracking-tight text-white leading-none mb-8 break-words">
              {page.hero.heading}
            </h1>
            <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl">{page.hero.sub}</p>
          </Reveal>
          <div className="arch-line mt-16 md:mt-20" />
        </div>
      </section>

      {/* Intro */}
      <Reveal className="max-w-[1440px] mx-auto px-8 py-20">
        <p className="text-zinc-400 text-xl leading-relaxed max-w-3xl">{page.intro}</p>
      </Reveal>

      {/* ── SECTIONS ──────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pb-20">
        {page.sections.map((section, i) => (
          <Reveal key={section.heading} delay={i * 0.06}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-12">
              <div className="lg:col-span-4">
                <h2 className="font-manrope font-bold text-2xl md:text-3xl text-white uppercase tracking-tight">
                  {section.heading}
                </h2>
              </div>
              <div className="lg:col-span-8">
                <p className="text-zinc-400 leading-relaxed">{section.body}</p>
              </div>
            </div>
            {i < page.sections.length - 1 && <div className="arch-line" />}
          </Reveal>
        ))}
      </section>

      {/* Price note */}
      <Reveal className="max-w-[1440px] mx-auto px-8 pb-24">
        <div className="ghost p-8 md:p-10 max-w-3xl">
          <p className="text-white text-lg leading-relaxed">{page.priceNote}</p>
        </div>
      </Reveal>

      {/* AI page only: links to the two free tools, reusing their /tools listing copy */}
      {slug === "ai-arendus" && (
        <Reveal className="max-w-[1440px] mx-auto px-8 pb-24">
          <div className="flex flex-wrap gap-4">
            {dict.tools.items.map((tool) => (
              <Link
                key={tool.href}
                href={`/${lang}${tool.href}`}
                className="ghost lbl text-white px-6 py-4 hover:text-accent hover:border-accent transition-colors"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* ── FAQ ───────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pb-40">
        <Reveal>
          <h2 className="font-manrope font-bold text-3xl md:text-4xl uppercase tracking-tight text-white mb-16">
            FAQ
          </h2>
        </Reveal>
        <div>
          {page.faq.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.06}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-10">
                <div className="lg:col-span-4">
                  <h3 className="font-manrope font-bold text-lg text-white">{item.q}</h3>
                </div>
                <div className="lg:col-span-8">
                  <p className="text-zinc-500 leading-relaxed">{item.a}</p>
                </div>
              </div>
              {i < page.faq.length - 1 && <div className="arch-line" />}
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="bg-zinc-950 py-40 border-b border-zinc-900">
        <Reveal className="max-w-[1440px] mx-auto px-8 flex flex-col items-center text-center">
          <h2 className="font-manrope font-bold text-[8vw] sm:text-4xl md:text-5xl uppercase tracking-tight text-white mb-14 break-words">
            {page.cta.heading}
          </h2>
          <Link
            href={`/${lang}/contact`}
            className="press bg-accent text-white font-manrope font-bold px-14 py-6 text-sm tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            {page.cta.button}
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
