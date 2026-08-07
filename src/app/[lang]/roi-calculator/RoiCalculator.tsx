"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Reveal, { StaggerReveal, StaggerItem } from "@/components/Reveal";
import SkeletonBlock from "@/components/SkeletonBlock";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ProjectionChart, BenchmarkBar, CumulativeReturnChart, SplitDonut, fmtCurrency, fmtPct } from "./charts";
import { trackEvent } from "@/components/Analytics";
import type { LensKey, RoiAnalysis, RoiInputs, Verdict } from "./types";

const EASE = [0.16, 1, 0.3, 1] as const;

type RoiDict = Dictionary["roiCalculator"];

// ── Benchmarks (ported from old portfolio roi-calculator-data.js) ──
const industryBenchmarks: Record<string, { avgROI: number; avgTimeSavings: number; avgRevenueIncrease: number }> = {
  retail:        { avgROI: 150, avgTimeSavings: 35, avgRevenueIncrease: 8 },
  manufacturing: { avgROI: 180, avgTimeSavings: 45, avgRevenueIncrease: 12 },
  healthcare:    { avgROI: 120, avgTimeSavings: 30, avgRevenueIncrease: 6 },
  finance:       { avgROI: 200, avgTimeSavings: 50, avgRevenueIncrease: 15 },
};

const defaults: RoiInputs = {
  industry: "retail",
  initialCost: 50000,
  annualCost: 10000,
  numEmployees: 10,
  hoursPerWeek: 5,
  hourlyWage: 25,
  annualRevenue: 1000000,
  timeSavings: 40,
  revenueIncrease: 5,
};

type Inputs = RoiInputs;

// ── Verdict → visual language. Colours only; the label comes from the
//    dictionary so it localizes with the rest of the UI. ──
const VERDICT_STYLES: Record<Verdict, { badge: string; bar: string; text: string }> = {
  PROCEED: {
    badge: "border-success/40 bg-success/[0.06]",
    bar: "bg-success",
    text: "text-success",
  },
  PROCEED_WITH_CAUTION: {
    badge: "border-warning/40 bg-warning/[0.06]",
    bar: "bg-warning",
    text: "text-warning",
  },
  RECONSIDER: {
    badge: "border-danger/40 bg-danger/[0.06]",
    bar: "bg-danger",
    text: "text-danger",
  },
};

// Keyed on the stable LensKey enum, never on a display string — the display
// label itself is localized via dict.lensLabels.
const LENS_ICON: Record<LensKey, string> = {
  FINANCIAL: "payments",
  OPERATIONAL: "settings",
  GROWTH: "trending_up",
  RISK: "shield",
};

// ── Numeric field ──
function Field({
  label,
  unit,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="lbl text-zinc-500 mb-2 block">{label}</span>
      <div className="ghost flex items-center gap-2 px-4 py-3 bg-surface-low focus-within:border-accent transition-colors">
        {unit === "€" && <span className="text-zinc-600 font-manrope">€</span>}
        <input
          type="number"
          step={step}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full bg-transparent outline-none text-white font-manrope font-bold text-lg tracking-tight"
        />
        {unit && unit !== "€" && <span className="text-zinc-600 lbl">{unit}</span>}
      </div>
    </label>
  );
}

// ── Metric tile ──
function Metric({ label, value, big = false, positive }: { label: string; value: string; big?: boolean; positive?: boolean }) {
  return (
    <div className="ghost p-6 bg-surface-low">
      <div className="lbl text-zinc-600 mb-3">{label}</div>
      <div
        className={`font-manrope font-black tracking-tight leading-none ${big ? "text-5xl" : "text-2xl"} ${
          positive === false ? "text-zinc-400" : positive ? "text-accent" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ── Skeleton loading state (replaces the spinner) ──
function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-44" />
        ))}
      </div>
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-40" />
    </div>
  );
}

type AiState = { loading: boolean; analysis: RoiAnalysis | null; error: string; status: number };
type LeadState = "idle" | "submitting" | "unlocked";
type PdfState = { downloading: boolean; error: string };

interface RoiCalculatorProps {
  lang: Locale;
  dict: RoiDict;
}

export default function RoiCalculator({ lang, dict }: RoiCalculatorProps) {
  const [inp, setInp] = useState<Inputs>(defaults);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp((s) => ({ ...s, [k]: v }));

  // ── Core formulas (ported 1:1 from roi-calculator.js) ──
  const r = useMemo(() => {
    const annualHoursSaved = inp.numEmployees * inp.hoursPerWeek * 52;
    const annualCostSavings = annualHoursSaved * inp.hourlyWage * (inp.timeSavings / 100);
    const annualRevenueGain = inp.annualRevenue * (inp.revenueIncrease / 100);
    const totalAnnualGain = annualCostSavings + annualRevenueGain;
    const totalFirstYearInvestment = inp.initialCost + inp.annualCost;
    const netFirstYearGain = totalAnnualGain - totalFirstYearInvestment;
    const roi = totalFirstYearInvestment > 0 ? (netFirstYearGain / totalFirstYearInvestment) * 100 : Infinity;

    // 5-year net-return projection (cumulative through each year)
    const projection = Array.from({ length: 5 }, (_, i) => {
      const annualReturn = totalAnnualGain * (i + 1);
      const totalInvestment = inp.initialCost + inp.annualCost * (i + 1);
      return annualReturn - totalInvestment;
    });

    return { annualCostSavings, annualRevenueGain, totalAnnualGain, netFirstYearGain, roi, projection };
  }, [inp]);

  const benchmark = inp.industry !== "custom" ? industryBenchmarks[inp.industry] : null;

  // ── AI analysis (wired to /api/gemini — needs GEMINI_API_KEY on server) ──
  const [ai, setAi] = useState<AiState>({ loading: false, analysis: null, error: "", status: 0 });

  async function runAnalysis() {
    setAi({ loading: true, analysis: null, error: "", status: 0 });
    trackEvent("ROI Analysis Started", { industry: inp.industry });
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "roi", lang, inputs: inp, results: r, benchmark }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status });
      setAi({ loading: false, analysis: data.analysis as RoiAnalysis, error: "", status: 0 });
      trackEvent("ROI Analysis Completed", { verdict: data.analysis?.verdict ?? "unknown" });
    } catch (e) {
      const status = typeof e === "object" && e && "status" in e ? Number((e as { status?: number }).status) : 0;
      setAi({ loading: false, analysis: null, error: e instanceof Error ? e.message : "", status });
    }
  }

  // ── Lead-gated PDF download ──
  const [email, setEmail] = useState("");
  const [leadState, setLeadState] = useState<LeadState>("idle");
  const [pdf, setPdf] = useState<PdfState>({ downloading: false, error: "" });

  async function triggerDownload() {
    if (!ai.analysis) return;
    setPdf({ downloading: true, error: "" });
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, inputs: inp, results: r, analysis: ai.analysis }),
      });
      if (!res.ok) {
        let msg = `Report request failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // response wasn't JSON — keep the generic message
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lang === "et" ? "janar-kuusk-ai-roi-raport.pdf" : "janar-kuusk-ai-roi-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPdf({ downloading: false, error: "" });
      trackEvent("ROI PDF Downloaded", { industry: inp.industry });
    } catch (e) {
      setPdf({ downloading: false, error: e instanceof Error ? e.message : "" });
    }
  }

  async function handleUnlockSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || leadState === "submitting") return;
    setLeadState("submitting");
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          scenario: { industry: inp.industry, roi: r.roi, verdict: ai.analysis?.verdict ?? null, lang },
        }),
      });
    } catch {
      // lead capture is best-effort — never block the download on it
    }
    trackEvent("ROI Lead Captured", { industry: inp.industry });
    setLeadState("unlocked");
    await triggerDownload();
  }

  const contactHref = useMemo(() => {
    const params = new URLSearchParams({ topic: "ai-roi", industry: inp.industry });
    if (Number.isFinite(r.roi)) params.set("roi", r.roi.toFixed(1));
    if (ai.analysis?.verdict) params.set("verdict", ai.analysis.verdict);
    return `/${lang}/contact?${params.toString()}`;
  }, [lang, inp.industry, r.roi, ai.analysis]);

  return (
    <section className="pt-40 pb-32 px-8 bg-black min-h-screen">
      <div className="max-w-[1440px] mx-auto">
        <Reveal className="mb-16">
          <div className="lbl text-accent mb-4">{dict.badge}</div>
          <h1 className="font-manrope font-black text-5xl md:text-7xl uppercase tracking-tight text-white leading-none mb-6">
            {dict.headingLine1}<br />{dict.headingLine2}
          </h1>
          <p className="text-zinc-500 max-w-xl leading-relaxed">{dict.intro}</p>
        </Reveal>

        <div className="grid grid-cols-12 gap-x-0 lg:gap-x-12 gap-y-16">
          {/* ── Inputs ── */}
          <Reveal className="col-span-12 lg:col-span-5 min-w-0">
            <div className="space-y-10">
              {/* Industry */}
              <div>
                <span className="lbl text-zinc-500 mb-3 block">{dict.industryLabel}</span>
                <div className="flex flex-wrap gap-2">
                  {dict.industries.map((it) => (
                    <button
                      key={it.key}
                      onClick={() => set("industry", it.key)}
                      className={`press ghost lbl px-4 py-2.5 ${
                        inp.industry === it.key ? "border-accent text-white bg-accent/10" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="lbl text-zinc-600 mb-4 flex items-center gap-3"><span className="arch-line w-6" /> {dict.sections.investment}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={dict.fields.initialSetup} unit="€" value={inp.initialCost} step={1000} onChange={(v) => set("initialCost", v)} />
                  <Field label={dict.fields.annualSubscription} unit="€" value={inp.annualCost} step={1000} onChange={(v) => set("annualCost", v)} />
                </div>
              </div>

              <div>
                <div className="lbl text-zinc-600 mb-4 flex items-center gap-3"><span className="arch-line w-6" /> {dict.sections.productivity}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={dict.fields.employees} value={inp.numEmployees} onChange={(v) => set("numEmployees", v)} />
                  <Field label={dict.fields.hourlyWage} unit="€" value={inp.hourlyWage} onChange={(v) => set("hourlyWage", v)} />
                  <Field label={dict.fields.hoursPerWeek} value={inp.hoursPerWeek} onChange={(v) => set("hoursPerWeek", v)} />
                  <Field label={dict.fields.timeSavings} unit="%" value={inp.timeSavings} onChange={(v) => set("timeSavings", v)} />
                </div>
              </div>

              <div>
                <div className="lbl text-zinc-600 mb-4 flex items-center gap-3"><span className="arch-line w-6" /> {dict.sections.revenue}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={dict.fields.annualRevenue} unit="€" value={inp.annualRevenue} step={10000} onChange={(v) => set("annualRevenue", v)} />
                  <Field label={dict.fields.revenueIncrease} unit="%" value={inp.revenueIncrease} onChange={(v) => set("revenueIncrease", v)} />
                </div>
              </div>

              <button onClick={() => setInp(defaults)} className="press lbl text-zinc-600 hover:text-accent transition-colors">
                {dict.resetDefaults}
              </button>

              <p className="text-zinc-700 text-xs leading-relaxed max-w-md">{dict.disclaimer}</p>
            </div>
          </Reveal>

          {/* ── Results ── */}
          <div className="col-span-12 lg:col-span-7 min-w-0 space-y-10">
            <Reveal>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Metric label={dict.metrics.firstYearRoi} value={fmtPct(r.roi)} big positive={r.roi >= 0} />
                </div>
                <Metric label={dict.metrics.netGainYr1} value={fmtCurrency(r.netFirstYearGain, lang)} positive={r.netFirstYearGain >= 0} />
                <Metric label={dict.metrics.totalAnnualGain} value={fmtCurrency(r.totalAnnualGain, lang)} />
                <Metric label={dict.metrics.costSavingsPerYr} value={fmtCurrency(r.annualCostSavings, lang)} />
                <Metric label={dict.metrics.revenueGainPerYr} value={fmtCurrency(r.annualRevenueGain, lang)} />
              </div>
            </Reveal>

            {/* Cumulative net-return curve + payback marker */}
            <Reveal>
              <div className="ghost p-8 bg-surface-low">
                <div className="lbl text-zinc-600 mb-8">{dict.chartTitles.cumulativeReturn}</div>
                <CumulativeReturnChart
                  initialCost={inp.initialCost}
                  projection={r.projection}
                  yearLabels={dict.yearLabels}
                  payback={dict.payback}
                />
              </div>
            </Reveal>

            {/* 5-year projection — hand-built SVG bars */}
            <Reveal>
              <div className="ghost p-8 bg-surface-low">
                <div className="lbl text-zinc-600 mb-8">{dict.chartTitles.projection}</div>
                <ProjectionChart data={r.projection} lang={lang} yearLabelTemplate={dict.yearLabelTemplate} />
              </div>
            </Reveal>

            {/* Cost savings vs revenue gain split */}
            <Reveal>
              <div className="ghost p-8 bg-surface-low">
                <div className="lbl text-zinc-600 mb-8">{dict.chartTitles.split}</div>
                <SplitDonut
                  costSavings={r.annualCostSavings}
                  revenueGain={r.annualRevenueGain}
                  lang={lang}
                  costSavedLabel={`${dict.costSavedLine1} ${dict.costSavedLine2}`}
                  costSavingsLabel={dict.metrics.costSavingsPerYr}
                  revenueGainLabel={dict.metrics.revenueGainPerYr}
                />
              </div>
            </Reveal>

            {/* Benchmark */}
            {benchmark && (
              <Reveal>
                <div className="ghost p-8 bg-surface-low">
                  <div className="lbl text-zinc-600 mb-8">{dict.chartTitles.benchmark}</div>
                  <BenchmarkBar label={dict.benchmarkLabels.roi} you={r.roi} avg={benchmark.avgROI} unit="%" avgLabel={dict.avgLabel} />
                  <BenchmarkBar label={dict.benchmarkLabels.timeSaved} you={inp.timeSavings} avg={benchmark.avgTimeSavings} unit="%" avgLabel={dict.avgLabel} />
                  <BenchmarkBar label={dict.benchmarkLabels.revenueIncrease} you={inp.revenueIncrease} avg={benchmark.avgRevenueIncrease} unit="%" avgLabel={dict.avgLabel} />
                </div>
              </Reveal>
            )}

            {/* ── AI analysis ── */}
            <Reveal>
              <div className="ghost p-8 bg-surface-low">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                  <div className="lbl text-zinc-600">{dict.aiAnalysis.title}</div>
                  <button
                    onClick={runAnalysis}
                    disabled={ai.loading}
                    className="press bg-accent text-white lbl px-6 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {ai.loading ? dict.aiAnalysis.analysing : ai.analysis ? dict.aiAnalysis.rerun : dict.aiAnalysis.getAnalysis}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {ai.loading && (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
                      <AnalysisSkeleton />
                    </motion.div>
                  )}

                  {!ai.loading && ai.error && (
                    <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger text-sm mt-4 leading-relaxed">
                      {ai.error}
                      {ai.status === 503 && dict.aiAnalysis.errorSuffix}
                    </motion.p>
                  )}

                  {!ai.loading && !ai.error && !ai.analysis && (
                    <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-600 text-sm mt-4 leading-relaxed">
                      {dict.aiAnalysis.emptyState}
                    </motion.p>
                  )}

                  {!ai.loading && ai.analysis && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="mt-8 space-y-10"
                    >
                      {/* Verdict banner + confidence meter */}
                      <div className={`ghost p-8 border ${VERDICT_STYLES[ai.analysis.verdict].badge}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                          <span className={`lbl ${VERDICT_STYLES[ai.analysis.verdict].text}`}>
                            {dict.verdicts[ai.analysis.verdict]}
                          </span>
                          <span className="lbl text-zinc-500">
                            {dict.aiAnalysis.confidence} {Math.round(ai.analysis.confidence)}%
                          </span>
                        </div>
                        <h3 className="font-manrope font-black text-2xl md:text-3xl text-white leading-tight mb-6">
                          {ai.analysis.headline}
                        </h3>
                        <div className="h-1.5 bg-surface-high">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, ai.analysis.confidence))}%` }}
                            transition={{ duration: 0.8, ease: EASE }}
                            className={`h-full ${VERDICT_STYLES[ai.analysis.verdict].bar}`}
                          />
                        </div>
                      </div>

                      {/* 4 perspective cards */}
                      <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ai.analysis.perspectives.map((p) => (
                          <StaggerItem key={p.lens} className="ghost p-6 bg-surface-mid">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="material-symbols-outlined text-accent text-2xl">
                                {LENS_ICON[p.lens] ?? "insights"}
                              </span>
                              <h4 className="font-manrope font-bold text-white">
                                {dict.lensLabels[p.lens] ?? p.lens}
                              </h4>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{p.summary}</p>
                            <ul className="space-y-2">
                              {p.points.map((pt, i) => (
                                <li key={i} className="flex gap-2 text-zinc-500 text-sm leading-relaxed">
                                  <span className="text-accent mt-0.5">›</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </StaggerItem>
                        ))}
                      </StaggerReveal>

                      {/* Risks & mitigations */}
                      <div className="ghost p-8 bg-surface-mid">
                        <div className="lbl text-zinc-600 mb-6">{dict.risksMitigations}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          {ai.analysis.risks.map((risk, i) => (
                            <div key={i} className="border-l-2 border-zinc-800 pl-4">
                              <div className="font-manrope font-bold text-white text-sm mb-1">{risk.risk}</div>
                              <div className="text-zinc-500 text-sm leading-relaxed">{risk.mitigation}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="ghost p-8 bg-surface-mid">
                        <div className="lbl text-zinc-600 mb-6">{dict.strategicRecommendations}</div>
                        <ol className="space-y-5">
                          {ai.analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-4">
                              <span className="font-manrope font-black text-accent text-xl leading-none shrink-0">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <div>
                                <div className="font-manrope font-bold text-white">{rec.title}</div>
                                <div className="text-zinc-500 text-sm leading-relaxed mt-1">{rec.detail}</div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Next step CTA */}
                      <div className="ghost p-8 bg-surface-mid flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <p className="text-zinc-300 leading-relaxed max-w-xl">{ai.analysis.nextStep}</p>
                        <Link
                          href={contactHref}
                          className="press bg-accent text-white lbl px-6 py-4 hover:bg-white hover:text-black transition-colors whitespace-nowrap text-center shrink-0"
                        >
                          {dict.bookConsultation}
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>

            {/* ── Branded PDF report (email-gated) ── */}
            {ai.analysis && (
              <Reveal>
                <div className="ghost p-8 bg-surface-low">
                  <div className="lbl text-zinc-600 mb-2">{dict.pdfReport.title}</div>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-lg">{dict.pdfReport.body}</p>

                  <AnimatePresence mode="wait">
                    {leadState !== "unlocked" ? (
                      <motion.form
                        key="gate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleUnlockSubmit}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={dict.pdfReport.emailPlaceholder}
                          aria-label={dict.pdfReport.emailPlaceholder}
                          className="ghost flex-1 px-4 py-3 bg-surface-mid text-white font-manrope font-bold text-sm placeholder:text-zinc-700 outline-none focus:border-accent transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={leadState === "submitting" || pdf.downloading}
                          className="press bg-accent text-white lbl px-6 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {leadState === "submitting" || pdf.downloading ? dict.pdfReport.preparing : dict.pdfReport.unlockButton}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 flex-wrap">
                        <button
                          onClick={triggerDownload}
                          disabled={pdf.downloading}
                          className="press bg-accent text-white lbl px-6 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                        >
                          {pdf.downloading ? dict.pdfReport.generating : dict.pdfReport.downloadButton}
                        </button>
                        <span className="lbl text-zinc-600">
                          {dict.pdfReport.sentToTemplate.replace("{email}", email.toUpperCase())}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {pdf.error && <p className="text-danger text-sm mt-4 leading-relaxed">{pdf.error}</p>}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
