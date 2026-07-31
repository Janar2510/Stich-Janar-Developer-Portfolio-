"use client";

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
      {/* Mobile overlay */}
      <div
        id="mob-menu"
        className={`mob-menu-overlay fixed inset-0 bg-black z-[60] flex flex-col justify-center px-8 lg:hidden ${open ? "open" : ""}`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-6 right-8 text-white text-4xl font-thin leading-none"
          aria-label={dict.closeMenu}
        >
          &times;
        </button>
        <nav className="flex flex-col gap-8 mb-12">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`font-manrope font-black text-5xl tracking-tight transition-colors hover:text-accent ${
                pathname === href ? "text-white" : "text-zinc-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 mb-10">
          {locales.map((locale) => (
            <Link
              key={locale}
              href={getPathForLocale(locale)}
              onClick={() => setOpen(false)}
              className={`lbl transition-colors ${
                locale === lang ? "text-accent" : "text-zinc-600 hover:text-white"
              }`}
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

      {/* Desktop nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex justify-between items-center w-full px-8 py-5 max-w-[1440px] mx-auto">
          <Link href={`/${lang}`} className="font-manrope font-black text-xl tracking-tighter text-white">
            JANAR KUUSK
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

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3">
              {locales.map((locale) => (
                <Link
                  key={locale}
                  href={getPathForLocale(locale)}
                  className={`lbl transition-colors ${
                    locale === lang ? "text-accent" : "text-zinc-500 hover:text-white"
                  }`}
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
              className="press lg:hidden text-white p-1"
              aria-label={dict.openMenu}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
