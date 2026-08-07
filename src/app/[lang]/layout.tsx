import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import Analytics from "@/components/Analytics";
import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { SITE_URL, localeUrl, languageAlternates } from "@/lib/site";
import { buildSiteSchema } from "@/lib/schema";
import { getDictionary } from "@/i18n/get-dictionary";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const eurostile = localFont({
  src: "../../../public/fonts/Eurostile Regular.otf",
  variable: "--font-eurostile",
});

const eurostileExtended = localFont({
  src: "../../../public/fonts/Eurostile Extended Regular.ttf",
  variable: "--font-eurostile-ext",
});

const OG_LOCALES: Record<Locale, string> = { et: "et_EE", en: "en_US" };

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);
  const seo = dict.seo.site;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.titleDefault,
      template: seo.titleTemplate,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "Janar Kuusk" }],
    creator: "Janar Kuusk",
    publisher: "Janar Kuusk",
    openGraph: {
      type: "website",
      locale: OG_LOCALES[lang] ?? OG_LOCALES[defaultLocale],
      siteName: "Janar Kuusk",
      url: localeUrl(lang),
    },
    alternates: {
      canonical: localeUrl(lang),
      languages: languageAlternates(),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${manrope.variable} ${spaceGrotesk.variable} ${eurostile.variable} ${eurostileExtended.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        {/* hreflang comes from generateMetadata's alternates.languages — emitting
            it here too produced duplicate tags on every page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSiteSchema(lang, dict)) }}
        />
      </head>
      <body className="bg-black text-[#e2e2e2] overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-accent focus:text-white focus:px-6 focus:py-3 focus:lbl"
        >
          {dict.a11y.skipToContent}
        </a>
        <Cursor />
        <Nav lang={lang} dict={dict.nav} />
        <main id="main-content">{children}</main>
        <Footer lang={lang} dict={dict.footer} />
        <Analytics />
      </body>
    </html>
  );
}
