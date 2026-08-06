import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

const socials = [
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/janar-kuusk-15528b1a0" },
  { label: "GITHUB", href: "https://github.com/Janar2510" },
];

interface FooterProps {
  lang: Locale;
  dict: Dictionary["footer"];
}

export default function Footer({ lang, dict }: FooterProps) {
  return (
    <footer className="border-t border-zinc-900 bg-black">
      <div className="max-w-[1440px] mx-auto px-8 py-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href={`/${lang}`} aria-label="Janar Kuusk" className="shrink-0">
          <Image
            src="/images/Logo/wordmark.png"
            alt="Janar Kuusk"
            width={364}
            height={102}
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex gap-10">
          {socials.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="lbl text-zinc-600 hover:text-accent underline underline-offset-8 decoration-1 transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href={`/${lang}/privacy`}
            className="lbl text-zinc-600 hover:text-accent underline underline-offset-8 decoration-1 transition-colors"
          >
            {dict.privacyLink}
          </Link>
        </div>
        <span className="lbl text-zinc-700">{dict.copyright}</span>
      </div>
    </footer>
  );
}
