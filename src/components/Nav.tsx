"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

interface NavProps {
  lang: Locale;
  dict: Dictionary["nav"];
}

export default function Nav({ lang, dict }: NavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links: { href: string; label: string }[] = [
    { href: `/${lang}`, label: dict.home },
    { href: `/${lang}/about`, label: dict.about },
    { href: `/${lang}/services`, label: dict.services },
    { href: `/${lang}/portfolio`, label: dict.portfolio },
    { href: `/${lang}/blog`, label: dict.blog },
    { href: `/${lang}/tools`, label: dict.tools },
    { href: `/${lang}/contact`, label: dict.contact },
  ];

  // Path-preserving language switch — swaps the leading /et or /en segment
  // and keeps whatever route the visitor is currently on.
  const getPathForLocale = (locale: Locale) => {
    if (!pathname) return `/${locale}`;
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  };

  return (
    <>
      {/* Mobile overlay. A non-scrolling header row holds the close button;
          the body scrolls if it ever needs to, and `my-auto` on the content
          centres it when it doesn't. justify-center on the scroller itself
          would clip the top — that is how the language switcher and contact
          button went missing on phones. */}
      <div
        id="mob-menu"
        className={`mob-menu-overlay fixed inset-0 bg-black z-[60] flex flex-col lg:hidden ${open ? "open" : ""}`}
      >
        <div className="flex justify-end px-8 pt-[calc(env(safe-area-inset-top)+1.25rem)] shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="press select-none [-webkit-touch-callout:none] flex h-11 w-11 items-center justify-center -mr-3 text-white text-4xl font-thin leading-none"
            aria-label={dict.closeMenu}
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] flex flex-col">
          <div className="my-auto">
            <nav className="flex flex-col gap-5 mb-10">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`font-manrope font-black text-[9vw] sm:text-5xl leading-[0.95] tracking-tight transition-colors hover:text-accent ${
                    pathname === href ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 -ml-3 mb-8">
              {locales.map((locale) => (
                <Link
                  key={locale}
                  href={getPathForLocale(locale)}
                  onClick={() => setOpen(false)}
                  className={`press flex h-11 min-w-11 items-center justify-center px-3 font-manrope font-bold text-2xl tracking-tight transition-colors ${
                    locale === lang ? "text-accent" : "text-zinc-500 hover:text-white"
                  }`}
                  aria-current={locale === lang ? "true" : undefined}
                >
                  {locale.toUpperCase()}
                </Link>
              ))}
            </div>
            <Link
              href={`/${lang}/contact`}
              onClick={() => setOpen(false)}
              className="press inline-block bg-accent text-white px-8 py-4 lbl hover:bg-white hover:text-black transition-colors self-start"
            >
              {dict.getInTouch}
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex justify-between items-center w-full px-8 py-5 max-w-[1440px] mx-auto">
          <Link href={`/${lang}`} aria-label="Janar Kuusk" className="shrink-0">
            <Image
              src="/images/Logo/wordmark.png"
              alt="Janar Kuusk"
              width={364}
              height={102}
              priority
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex gap-10">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`lbl transition-colors ${
                  pathname === href
                    ? "text-accent border-b border-accent pb-1"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 lg:gap-6">
            {/* Language switcher at every size. On phones it used to live only
                inside the hamburger menu, at 11px, below the fold of the
                overlay — effectively hidden. */}
            <div className="flex items-center gap-0.5 lg:gap-3">
              {locales.map((locale) => (
                <Link
                  key={locale}
                  href={getPathForLocale(locale)}
                  className={`press flex h-11 min-w-11 items-center justify-center font-grotesk text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors lg:h-auto lg:min-w-0 lg:text-[11px] lg:font-medium ${
                    locale === lang ? "text-accent" : "text-zinc-400 hover:text-white lg:text-zinc-500"
                  }`}
                  aria-current={locale === lang ? "true" : undefined}
                >
                  {locale.toUpperCase()}
                </Link>
              ))}
            </div>
            <Link
              href={`/${lang}/contact`}
              className="press hidden lg:inline-block bg-accent text-white px-6 py-3 lbl hover:bg-white hover:text-black transition-colors"
            >
              {dict.consultation}
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="press lg:hidden select-none [-webkit-touch-callout:none] flex h-11 w-11 items-center justify-center -mr-2 text-white"
              aria-label={dict.openMenu}
            >
              {/* The icon is a ligature — real text — so without select-none a
                  long-press on iOS highlights the word "menu". */}
              <span className="material-symbols-outlined select-none" aria-hidden="true">menu</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
