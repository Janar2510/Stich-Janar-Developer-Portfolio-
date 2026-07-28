import type { Metadata } from "next";
import Link from "next/link";
import Reveal, { StaggerReveal, StaggerItem } from "@/components/Reveal";
import HeroVideoBg from "@/components/HeroVideoBg";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getAllPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

const BASE_URL = "https://janarkuusk.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.pages.blog;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/blog`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/blog`])),
    },
  };
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.blog;
  const posts = getAllPosts(lang);

  return (
    <div>
      {/* ── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0D0D0D] pt-36 pb-20 md:pt-48 md:pb-28">
        <HeroVideoBg />
        <div className="relative z-10 max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12">
            <div>
              <span className="lbl text-accent block mb-6 hi">{t.badge}</span>
              <h1 className="font-manrope font-black text-6xl md:text-8xl uppercase tracking-tight text-white leading-none hi-mask break-words">
                {t.heading}
              </h1>
            </div>
            <div className="pb-2 hi-d2">
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xs">{t.intro}</p>
            </div>
          </div>
          <div className="arch-line mt-16 md:mt-20" />
        </div>
      </section>

      {/* ── POSTS GRID ────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-40">
        {posts.length === 0 ? (
          <Reveal>
            <p className="text-zinc-600 lbl">{t.emptyState}</p>
          </Reveal>
        ) : (
          <StaggerReveal className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <StaggerItem key={post.slug}>
                <Link
                  href={`/${lang}/blog/${post.slug}`}
                  className="group proj-card ghost hover:border-accent transition-colors duration-500 p-10 md:p-14 flex flex-col h-full"
                >
                  <span className="lbl text-zinc-600 mb-4 block">
                    {formatDate(new Date(post.frontmatter.date), lang)}
                  </span>
                  <h2 className="font-manrope font-bold text-2xl md:text-3xl text-white uppercase tracking-tight mb-5">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-zinc-500 leading-relaxed text-sm mb-10 flex-1">{post.frontmatter.excerpt}</p>
                  <span className="lbl text-white group-hover:text-accent transition-colors flex items-center gap-2">
                    {t.readMore} <span className="material-symbols-outlined text-base">north_east</span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerReveal>
        )}
      </section>
    </div>
  );
}
