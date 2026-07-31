'use client'

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import HeroVideoBg from "@/components/HeroVideoBg"
import type { Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n/get-dictionary"

const clip = (delay: number) => ({
  initial: { clipPath: "inset(0 0 100% 0)" },
  animate: { clipPath: "inset(0 0 0% 0)" },
  transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const, delay },
})

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay },
})

interface HeroSectionProps {
  lang: Locale;
  dict: Dictionary["home"]["hero"];
}

export default function HeroSection({ lang, dict }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  const portraitY = useTransform(scrollYProgress, [0, 1],  ["0%", "-12%"])
  const nameY     = useTransform(scrollYProgress, [0, 0.6], ["0%",  "-8%"])
  const nameOp    = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const leftX     = useTransform(scrollYProgress, [0, 0.6], ["0%",  "-12%"])
  const rightX    = useTransform(scrollYProgress, [0, 0.6], ["0%",   "12%"])

  return (
    <section
      ref={sectionRef}
      className="relative h-svh md:h-screen overflow-hidden bg-[#0D0D0D]"
    >
      {/* ── BACKGROUND VIDEO ────────────────── */}
      <HeroVideoBg />

      {/* ── NAME — Sits behind portrait ───────── */}
      <motion.div
        className="absolute inset-x-0 z-[5] top-[16%] md:top-[15%] flex justify-center text-center px-4"
        style={{ y: nameY, opacity: nameOp }}
      >
        <motion.h1
          className="hero-name text-[#EDEDED] tracking-[-0.04em]"
          {...clip(0)}
        >
          JANAR KUUSK
        </motion.h1>
      </motion.div>

      {/* ── ROLE WORDS — Split sides ──────────── */}
      <div className="absolute inset-x-0 z-[10] top-[32%] md:top-[42%] -translate-y-1/2 flex items-center justify-between px-7 md:px-20 lg:px-28 pointer-events-none">
        <motion.div
          style={{ x: leftX }}
          {...clip(0.25)}
        >
          <span className="hero-role block text-[#EDEDED]/40">{dict.developer}</span>
        </motion.div>

        <motion.div
          className="text-right"
          style={{ x: rightX }}
          {...clip(0.4)}
        >
          <span className="hero-role block text-[#EDEDED]/40 text-right">{dict.designer}</span>
        </motion.div>
      </div>

      {/* ── PORTRAIT — Centered ───────────────── */}
      <motion.div
        // The portrait PNG is 3:4. On mobile the container must declare that
        // ratio: `w-auto` on an absolutely-positioned box wrapping an image
        // capped at max-width:100% is circular, and the figure collapses to a
        // sliver. Desktop keeps the original auto sizing.
        className="pointer-events-none absolute bottom-[9%] left-1/2 z-[20] -translate-x-1/2 h-[72%] aspect-[3/4] md:bottom-0 md:h-[94%] md:aspect-auto md:w-auto"
        style={{ y: portraitY }}
        {...fade(0.1)}
      >
        <Image
          src="/janar-hero-nobg.png"
          alt="Janar Kuusk"
          width={900}
          height={1200}
          className="h-full w-auto object-contain object-bottom"
          priority
        />
        {/* Bottom blend — Seamless transition into background */}
        <div
          className="pointer-events-none absolute inset-x-[-10%] bottom-0"
          style={{
            height: "35%",
            background: "linear-gradient(to top, #0D0D0D 15%, #0D0D0D/60 40%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* ── SCRIM — Keeps the bottom copy legible where the portrait sits
             behind it. Only needed on mobile; desktop has the room to put
             the text clear of the figure. ───────── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-[34%] md:hidden"
        style={{
          background:
            "linear-gradient(to top, #0D0D0D 42%, rgba(13,13,13,0.9) 72%, transparent 100%)",
        }}
      />

      {/* ── BOTTOM UI ─────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-[30] flex flex-col md:flex-row items-start md:items-end justify-between px-7 md:px-12 pb-10 gap-10">
        {/* Left: pill + bio + button */}
        <div className="max-w-[360px]">
          <motion.div
            className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#262626] bg-[#050505]/80 backdrop-blur-md"
            {...fade(0.58)}
          >
            <div className="relative h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative block h-2 w-2 rounded-full bg-green-500" />
            </div>
            <span className="lbl text-[#EDEDED]/70 text-[10px]">{dict.openForWork}</span>
          </motion.div>

          <motion.p className="mb-8 text-[15px] md:text-[17px] leading-relaxed text-[#EDEDED]/80 md:text-[#EDEDED]/60 font-light" {...fade(0.7)}>
            {dict.bio}
          </motion.p>

          <motion.div {...fade(0.82)}>
            <Link
              href={`/${lang}/contact`}
              className="press ghost pointer-events-auto inline-flex items-center gap-3 px-10 py-4 lbl text-[#EDEDED] hover:border-accent hover:bg-accent rounded-full border-[#262626] bg-[#0D0D0D]"
            >
              {dict.scheduleCall}
              <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </Link>
          </motion.div>
        </div>

        {/* Right: location + divider */}
        <motion.div className="hidden md:flex flex-col items-end gap-6" {...fade(0.76)}>
          <div className="flex flex-col items-end text-[#EDEDED]/40">
            <span className="lbl text-[10px] mb-1">{dict.location}</span>
            <span className="lbl">{dict.locationValue}</span>
          </div>
          <div className="w-[1px] h-20 bg-gradient-to-b from-[#262626] via-[#262626] to-transparent" />
        </motion.div>
      </div>
    </section>
  )
}
