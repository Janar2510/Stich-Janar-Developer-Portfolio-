import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import MdxContent from "@/components/MdxContent";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { formatDate } from "@/lib/format";

const BASE_URL = "https://janarkuusk.com";

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const post = getPostBySlug(slug, lang);
  if (!post) return {};

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    alternates: {
      canonical: `${BASE_URL}/${lang}/blog/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])),
    },
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      publishedTime: post.frontmatter.date,
      url: `${BASE_URL}/${lang}/blog/${slug}`,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const t = dict.blog;
  const post = getPostBySlug(slug, lang);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    datePublished: post.frontmatter.date,
    author: { "@type": "Person", name: "Janar Kuusk", url: BASE_URL },
    url: `${BASE_URL}/${lang}/blog/${slug}`,
  };

  return (
    <div className="pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-[760px] mx-auto px-8 py-20">
        <Reveal>
          <Link href={`/${lang}/blog`} className="lbl text-zinc-500 hover:text-accent transition-colors mb-10 inline-block">
            {t.backToBlog}
          </Link>
          <p className="lbl text-zinc-600 mb-4">
            {t.publishedOn} {formatDate(new Date(post.frontmatter.date), lang)}
          </p>
          <h1 className="font-manrope font-black text-3xl md:text-5xl uppercase tracking-tight text-white leading-tight mb-6 break-words">
            {post.frontmatter.title}
          </h1>
          <p className="text-zinc-400 leading-relaxed text-lg mb-4">{post.frontmatter.excerpt}</p>
          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.frontmatter.tags.map((tag) => (
                <span key={tag} className="ghost lbl text-zinc-500 px-3 py-1.5">{tag}</span>
              ))}
            </div>
          )}
        </Reveal>

        <div className="arch-line mb-12" />

        <Reveal delay={0.1}>
          <MdxContent source={post.content} />
        </Reveal>
      </article>
    </div>
  );
}
