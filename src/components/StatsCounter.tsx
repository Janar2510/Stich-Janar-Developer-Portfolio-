"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  suffix: string;
  label: string;
}

interface StatsSectionProps {
  items: StatItem[];
}

// Numeric values + the one text-only stat (Tartu) stay code-side — only
// the label/suffix copy is localized.
const VALUES = [3, 20, 4, 0];
const TEXT_OVERRIDE: Record<number, string> = { 3: "TARTU" };

const DURATION = 1600;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(value);
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / DURATION, 1);
            setCount(Math.round(easeOutQuart(t) * value));
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {count}{suffix}
    </span>
  );
}

export default function StatsSection({ items }: StatsSectionProps) {
  return (
    <section className="py-20 border-y border-zinc-900 bg-zinc-950">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:divide-x divide-zinc-800">
          {items.map(({ suffix, label }, i) => {
            const value = VALUES[i] ?? 0;
            const isText = i in TEXT_OVERRIDE;
            return (
              <div key={label} className="text-center md:px-12">
                <div
                  className="font-manrope font-black mb-3 leading-none"
                  style={{
                    fontSize: "clamp(38px, 5vw, 72px)",
                    letterSpacing: "-0.04em",
                    color: isText ? "var(--color-accent)" : "#fff",
                    ...(isText && { fontSize: "clamp(18px, 2.4vw, 30px)" }),
                  }}
                >
                  {isText ? TEXT_OVERRIDE[i] : <Counter value={value} suffix={suffix} />}
                </div>
                <div className="lbl text-zinc-600">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
