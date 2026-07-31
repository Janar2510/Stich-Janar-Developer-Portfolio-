"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Category = "all" | "design" | "development" | "ai";

interface ProjectCopy {
  id: number;
  title: string;
  sub: string;
  body: string;
  tags: string[];
}

export interface FilterCopy {
  key: Category;
  label: string;
}

interface ProjectMeta {
  category: Exclude<Category, "all">;
  image: string;
  featured: boolean;
  span: number;
  ai: boolean;
  link?: string;
}

// Visual/structural metadata — not localized, keyed by the stable project id.
const PROJECT_META: Record<number, ProjectMeta> = {
  1: { category: "ai", image: "/images/project-neural-core.jpg", featured: true, span: 12, ai: true },
  2: { category: "ai", image: "/images/project-axis-mobile.jpg", featured: false, span: 7, ai: false },
  3: { category: "development", image: "/images/project-steel-data.jpg", featured: false, span: 5, ai: false },
  4: { category: "design", image: "/images/project-biopuhastid-2.jpg", featured: false, span: 7, ai: false, link: "https://biopuhastid.com" },
  5: { category: "design", image: "/images/project-kuusdisain.jpg", featured: false, span: 5, ai: false, link: "https://www.kuusdisain.ee" },
};

// Tailwind can't generate col-span-N from template literals — explicit map required
const colSpan: Record<number, string> = {
  4:  "col-span-12 md:col-span-4",
  5:  "col-span-12 md:col-span-5",
  6:  "col-span-12 md:col-span-6",
  7:  "col-span-12 md:col-span-7",
  12: "col-span-12",
};

interface PortfolioGridProps {
  projects: ProjectCopy[];
  filters: FilterCopy[];
  aiProjectBadge: string;
}

export default function PortfolioGrid({ projects, filters, aiProjectBadge }: PortfolioGridProps) {
  const [active, setActive] = useState<Category>("all");

  const merged = projects.map((p) => ({ ...p, ...PROJECT_META[p.id] }));
  const visible = merged.filter((p) => active === "all" || p.category === active);

  return (
    <>
      {/* Filter tabs — shared-layout pill morphs between active states */}
      <div className="flex flex-wrap gap-3 mb-20">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`press filter-btn ghost lbl relative px-6 py-3 ${
              active === key ? "active" : "text-zinc-500 hover:text-white hover:border-zinc-500"
            }`}
          >
            {active === key && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 bg-accent"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-12 gap-x-0 md:gap-x-8 gap-y-24">
        <AnimatePresence mode="popLayout">
          {visible.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`${colSpan[p.span]} proj-card group`}
            >
              {/* ── Featured wide layout ── */}
              {p.featured && !p.ai && (
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start lg:items-center">
                  <div className="w-full lg:w-[62%] relative aspect-video overflow-hidden">
                    <div className="stack-bg" />
                    <Image
                      className="proj-img z-10 object-cover"
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 62vw"
                    />
                  </div>
                  <div className="w-full lg:w-[38%]">
                    <span className="lbl text-zinc-600 mb-3 block">{p.sub}</span>
                    <h2 className="font-manrope font-bold text-4xl lg:text-5xl text-white uppercase tracking-tight mb-6 leading-none">{p.title}</h2>
                    <p className="text-zinc-500 leading-relaxed mb-8 text-sm">{p.body}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((tag) => (
                        <span key={tag} className="ghost lbl text-zinc-600 px-3 py-1.5">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI featured layout ── */}
              {p.featured && p.ai && (
                <div className="ghost hover:border-accent transition-colors duration-500 grid md:grid-cols-2">
                  <div className="w-full aspect-video md:aspect-auto overflow-hidden relative min-h-[300px]">
                    <Image
                      className="proj-img object-cover"
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-6 left-6">
                      <span className="ai-badge lbl px-4 py-2">{aiProjectBadge}</span>
                    </div>
                  </div>
                  <div className="p-10 lg:p-16 flex flex-col justify-center">
                    <span className="lbl text-accent mb-4 block">{p.sub}</span>
                    <h3 className="font-manrope font-black text-3xl lg:text-4xl text-white uppercase tracking-tight mb-6 leading-tight">{p.title}</h3>
                    <p className="text-zinc-500 leading-relaxed mb-8 text-sm">{p.body}</p>
                    <div className="flex flex-wrap gap-3">
                      {p.tags.map((tag) => (
                        <span key={tag} className="ghost lbl text-zinc-500 px-3 py-2">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Card layout ── */}
              {!p.featured && (
                <>
                  <div className={`relative overflow-hidden mb-8 ${p.span === 4 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                    <div className="stack-bg" />
                    <Image
                      className="proj-img z-10 object-cover"
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div>
                    <span className="lbl text-zinc-600 mb-2 block">{p.sub}</span>
                    <h3 className="font-manrope font-bold text-2xl lg:text-3xl text-white uppercase tracking-tight">{p.title}</h3>
                    {p.body && <p className="text-zinc-400 mt-3 text-sm leading-relaxed max-w-xs">{p.body}</p>}
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lbl text-zinc-500 hover:text-accent transition-colors mt-3 inline-flex items-center gap-1.5"
                      >
                        {p.link.replace(/^https?:\/\//, "")}
                        <span className="material-symbols-outlined text-sm">north_east</span>
                      </a>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
