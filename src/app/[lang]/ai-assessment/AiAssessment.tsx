"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import { trackEvent } from "@/components/Analytics";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type AssessmentDict = Dictionary["aiAssessment"];
type Tier = AssessmentDict["tiers"][number];

function tierFor(tiers: Tier[], score: number): Tier {
  return [...tiers].reverse().find((t) => score >= t.min) ?? tiers[0];
}

interface AiAssessmentProps {
  lang: Locale;
  dict: AssessmentDict;
}

export default function AiAssessment({ lang, dict }: AiAssessmentProps) {
  const questions = dict.questions;
  const tiers = dict.tiers;
  const scaleHints = dict.scaleHints;

  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const setAnswer = (i: number, v: number) =>
    setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)));

  const answered = answers.filter((s) => s > 0).length;
  const allAnswered = answered === questions.length;

  const result = useMemo(() => {
    const total = answers.reduce((s, v) => s + v, 0);
    const score = Math.round((total / (questions.length * 5)) * 100);
    const tier = tierFor(tiers, score);
    const weak = questions.filter((_, i) => answers[i] > 0 && answers[i] <= 2).map((q) => q.title);
    return { score, tier, weak };
  }, [answers, questions, tiers]);

  // ── AI narrative (wired to /api/gemini — needs GEMINI_API_KEY on server) ──
  const [ai, setAi] = useState<{ loading: boolean; text: string; error: string }>({ loading: false, text: "", error: "" });
  async function runAnalysis() {
    setAi({ loading: true, text: "", error: "" });
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "assessment",
          lang,
          score: result.score,
          tier: result.tier.name,
          answers: questions.map((q, i) => ({ area: q.title, score: answers[i] })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setAi({ loading: false, text: data.text || "", error: "" });
      trackEvent("Assessment AI Plan Generated", { tier: result.tier.name });
    } catch (e) {
      setAi({ loading: false, text: "", error: e instanceof Error ? e.message : "Analysis unavailable" });
    }
  }

  function reset() {
    setAnswers(Array(questions.length).fill(0));
    setSubmitted(false);
    setAi({ loading: false, text: "", error: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="pt-40 pb-32 px-8 bg-black min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <Reveal className="mb-16">
          <div className="lbl text-accent mb-4">{dict.badge}</div>
          <h1 className="font-manrope font-black text-5xl md:text-7xl uppercase tracking-tight text-white leading-none mb-6">
            {dict.headingLine1}<br />{dict.headingLine2}
          </h1>
          <p className="text-zinc-500 max-w-xl leading-relaxed">
            {dict.intro}
          </p>
        </Reveal>

        {!submitted && (
          <>
            {/* progress */}
            <Reveal className="mb-12">
              <div className="flex items-center justify-between lbl text-zinc-500 mb-3">
                <span>{dict.progress}</span>
                <span>{answered} / {questions.length}</span>
              </div>
              <div className="h-1 bg-surface-high">
                <motion.div
                  className="h-full bg-accent"
                  animate={{ width: `${(answered / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </Reveal>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <Reveal key={q.title} delay={Math.min(i * 0.04, 0.3)}>
                  <div className="ghost p-6 bg-surface-low flex flex-col md:flex-row md:items-center gap-6 justify-between">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="lbl text-zinc-700">{String(i + 1).padStart(2, "0")}</span>
                        <h3 className="font-manrope font-bold text-lg text-white">{q.title}</h3>
                      </div>
                      <p className="text-zinc-500 text-sm mt-1 md:ml-9">{q.explanation}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 md:ml-9">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setAnswer(i, s)}
                          title={scaleHints[s - 1]}
                          className={`press w-11 h-11 lbl border transition-colors ${
                            answers[i] === s
                              ? "bg-accent border-accent text-white"
                              : "border-zinc-700 text-zinc-500 hover:border-accent hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-6">
              <button
                onClick={() => {
                  setSubmitted(true);
                  trackEvent("Assessment Completed", { tier: result.tier.name, score: result.score });
                }}
                disabled={!allAnswered}
                className="press bg-accent text-white font-manrope font-bold py-5 px-12 text-sm tracking-widest hover:bg-white hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {dict.calculateScore}
              </button>
              {!allAnswered && (
                <span className="lbl text-zinc-600">
                  {dict.answerAllTemplate.replace("{count}", String(questions.length))}
                </span>
              )}
            </div>
          </>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-12 md:col-span-4 flex justify-center">
                  <ScoreRing score={result.score} scoreOutOf={dict.scoreOutOf} />
                </div>
                <div className="col-span-12 md:col-span-8">
                  <div className="lbl text-accent mb-3">{dict.maturityTier}</div>
                  <h2 className="font-manrope font-black text-4xl md:text-5xl uppercase tracking-tight text-white mb-5">
                    {result.tier.name}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">{result.tier.summary}</p>
                </div>
              </div>

              {result.weak.length > 0 && (
                <div className="ghost p-8 bg-surface-low">
                  <div className="lbl text-zinc-600 mb-5">{dict.priorityFocusAreas}</div>
                  <div className="flex flex-wrap gap-3">
                    {result.weak.map((w) => (
                      <span key={w} className="ai-badge lbl px-4 py-2">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI narrative */}
              <div className="ghost p-8 bg-surface-low">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                  <div className="lbl text-zinc-600">{dict.aiActionPlan}</div>
                  <button
                    onClick={runAnalysis}
                    disabled={ai.loading}
                    className="press bg-accent text-white lbl px-6 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {ai.loading ? dict.generating : dict.getAiActionPlan}
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  {ai.error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-500 text-sm mt-4 leading-relaxed">
                      {ai.error}{dict.errorSuffix}
                    </motion.p>
                  )}
                  {ai.text && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-zinc-300 text-sm mt-6 leading-relaxed whitespace-pre-wrap">
                      {ai.text}
                    </motion.div>
                  )}
                  {!ai.text && !ai.error && !ai.loading && (
                    <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                      {dict.emptyState}
                    </p>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={reset} className="press lbl text-zinc-500 hover:text-accent transition-colors">
                {dict.retake}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Circular score ring (pure SVG) ──
function ScoreRing({ score, scoreOutOf }: { score: number; scoreOutOf: string }) {
  const R = 84;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  return (
    <div className="relative w-56 h-56">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={R} fill="none" stroke="#1c1c1c" strokeWidth="10" />
        <motion.circle
          cx="100" cy="100" r={R} fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - dash }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-manrope font-black text-6xl text-white leading-none">{score}</span>
        <span className="lbl text-zinc-600 mt-1">{scoreOutOf}</span>
      </div>
    </div>
  );
}
