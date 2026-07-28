"use client";

// Hand-built SVG/CSS charts for the ROI calculator — no chart dependency.
// Matches the site's motion language: framer-motion, ease [0.16,1,0.3,1].

import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatPercent } from "@/lib/format";

const EASE = [0.16, 1, 0.3, 1] as const;

export const fmtCurrency = (v: number, lang: Locale = "et") => formatCurrency(v, lang);
export const fmtPct = (v: number) => formatPercent(v);

const DEFAULT_PAYBACK_DICT: PaybackDict = {
  prefix: "Payback:",
  beyond: "Beyond 5 years",
  immediate: "Immediate",
  approxTemplate: "~{n} years",
};
const DEFAULT_YEAR_LABELS = ["START", "YR 1", "YR 2", "YR 3", "YR 4", "YR 5"];
const DEFAULT_YEAR_LABEL_TEMPLATE = "YR {n}";

interface PaybackDict {
  prefix: string;
  beyond: string;
  immediate: string;
  approxTemplate: string;
}

/* ─────────────────────────────────────────
   5-year net-return projection (bars)
───────────────────────────────────────── */
export function ProjectionChart({
  data,
  lang = "et",
  yearLabelTemplate = DEFAULT_YEAR_LABEL_TEMPLATE,
}: {
  data: number[];
  lang?: Locale;
  yearLabelTemplate?: string;
}) {
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const zeroTop = (max / range) * 100; // % from top where the 0 line sits
  return (
    <div className="w-full">
      <div className="relative grid grid-cols-5 gap-4 h-56">
        <div className="absolute left-0 right-0 border-t border-dashed border-zinc-800 z-10" style={{ top: `${zeroTop}%` }} />
        {data.map((v, i) => {
          const pos = v >= 0;
          const hPct = (Math.abs(v) / range) * 100;
          return (
            <div key={i} className="relative h-full">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${hPct}%` }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                className={`absolute left-0 right-0 ${pos ? "bg-accent" : "bg-zinc-700"}`}
                style={pos ? { bottom: `${100 - zeroTop}%` } : { top: `${zeroTop}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-4 mt-4">
        {data.map((v, i) => (
          <div key={i} className="text-center">
            <div className={`font-manrope font-bold text-xs ${v >= 0 ? "text-accent" : "text-zinc-500"}`}>{fmtCurrency(v, lang)}</div>
            <div className="lbl text-zinc-700 mt-1">{yearLabelTemplate.replace("{n}", String(i + 1))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Benchmark comparison bar
───────────────────────────────────────── */
export function BenchmarkBar({
  label,
  you,
  avg,
  unit,
  avgLabel = "avg",
}: {
  label: string;
  you: number;
  avg: number;
  unit: string;
  avgLabel?: string;
}) {
  const scale = Math.max(you, avg, 1);
  const youPct = Math.min((Math.max(you, 0) / scale) * 100, 100);
  const avgPct = Math.min((avg / scale) * 100, 100);
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between lbl text-zinc-500 mb-2">
        <span>{label}</span>
        <span>
          <span className="text-accent">{fmtPct(you).replace("%", "")}{unit}</span>
          <span className="text-zinc-700"> / {avgLabel} {avg}{unit}</span>
        </span>
      </div>
      <div className="relative h-2 bg-surface-high">
        <div className="absolute top-0 left-0 h-full bg-zinc-700" style={{ width: `${avgPct}%` }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${youPct}%` }}
          transition={{ duration: 0.6, ease: EASE }}
          className="absolute top-0 left-0 h-full bg-accent"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Cumulative net-return curve + payback marker
   projection[i] = cumulative net return through year i+1.
   Prepend year-0 (= -initialCost, before any gains land).
───────────────────────────────────────── */
export function computePayback(initialCost: number, projection: number[]): number | null {
  const cumulative = [-initialCost, ...projection];
  if (cumulative[0] >= 0) return 0;
  for (let i = 1; i < cumulative.length; i++) {
    if (cumulative[i] >= 0) {
      const frac = (0 - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
      return i - 1 + frac;
    }
  }
  return null;
}

export function CumulativeReturnChart({
  initialCost,
  projection,
  yearLabels = DEFAULT_YEAR_LABELS,
  payback: paybackDict = DEFAULT_PAYBACK_DICT,
}: {
  initialCost: number;
  projection: number[];
  yearLabels?: string[];
  payback?: PaybackDict;
}) {
  const cumulative = [-initialCost, ...projection];
  const max = Math.max(...cumulative, 0);
  const min = Math.min(...cumulative, 0);
  const range = max - min || 1;

  const W = 600;
  const H = 220;
  const PAD_Y = 14;

  const xAt = (i: number) => (i / (cumulative.length - 1)) * W;
  const yAt = (v: number) => PAD_Y + (1 - (v - min) / range) * (H - PAD_Y * 2);

  const points = cumulative.map((v, i) => [xAt(i), yAt(v)] as const);
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const zeroY = yAt(0);

  const paybackYear = computePayback(initialCost, projection);
  const paybackX = paybackYear !== null ? xAt(paybackYear) : null;
  const paybackY = paybackYear !== null ? yAt(0) : null;
  const paybackLabel =
    paybackYear === null
      ? paybackDict.beyond
      : paybackYear <= 0.05
        ? paybackDict.immediate
        : paybackDict.approxTemplate.replace("{n}", paybackYear.toFixed(1));

  return (
    <div className="w-full">
      <div className="relative h-56">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* zero baseline */}
          <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#2e2e2e" strokeDasharray="4 4" strokeWidth="1" />

          {/* area fill */}
          <motion.path
            d={areaPath}
            fill="url(#cumFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          />

          {/* line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
          />

          {/* payback marker */}
          {paybackX !== null && paybackY !== null && (
            <>
              <line x1={paybackX} y1={PAD_Y} x2={paybackX} y2={H - PAD_Y} stroke="#EDEDED" strokeDasharray="3 4" strokeWidth="1" opacity={0.35} />
              <motion.circle
                cx={paybackX}
                cy={paybackY}
                r="5"
                fill="#0D0D0D"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: EASE, delay: 1.1 }}
              />
            </>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="grid grid-cols-6 gap-4 flex-1">
          {yearLabels.map((label) => (
            <div key={label} className="lbl text-zinc-700 text-center">{label}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 ghost px-4 py-2 bg-surface-mid">
        <span className="material-symbols-outlined text-accent text-base">flag</span>
        <span className="lbl text-zinc-400">{paybackDict.prefix} <span className="text-accent">{paybackLabel}</span></span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Cost-savings vs revenue-gain split (donut)
───────────────────────────────────────── */
function LegendRow({ color, label, value, pct }: { color: string; label: string; value: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 h-3 shrink-0" style={{ backgroundColor: color }} />
      <div>
        <div className="lbl text-zinc-500">{label}</div>
        <div className="font-manrope font-bold text-white">
          {value} <span className="text-zinc-600 font-normal text-sm">({pct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}

export function SplitDonut({
  costSavings,
  revenueGain,
  lang = "et",
  costSavedLabel = "Cost Saved",
  costSavingsLabel = "Cost Savings",
  revenueGainLabel = "Revenue Gain",
}: {
  costSavings: number;
  revenueGain: number;
  lang?: Locale;
  costSavedLabel?: string;
  costSavingsLabel?: string;
  revenueGainLabel?: string;
}) {
  const total = Math.max(costSavings + revenueGain, 1);
  const pctCost = (Math.max(costSavings, 0) / total) * 100;
  const pctRevenue = 100 - pctCost;

  const R = 70;
  const C = 2 * Math.PI * R;
  const costDash = (pctCost / 100) * C;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-10">
      <div className="relative w-44 h-44 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#3f3f46" strokeWidth="16" />
          <motion.circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="16"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - costDash }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-manrope font-black text-3xl text-white leading-none">{pctCost.toFixed(0)}%</span>
          <span className="lbl text-zinc-600 mt-1 text-center">{costSavedLabel}</span>
        </div>
      </div>
      <div className="space-y-5">
        <LegendRow color="var(--color-accent)" label={costSavingsLabel} value={fmtCurrency(costSavings, lang)} pct={pctCost} />
        <LegendRow color="#3f3f46" label={revenueGainLabel} value={fmtCurrency(revenueGain, lang)} pct={pctRevenue} />
      </div>
    </div>
  );
}
