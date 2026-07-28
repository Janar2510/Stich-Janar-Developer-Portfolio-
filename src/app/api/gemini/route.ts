import { NextResponse } from "next/server";
import type { RoiAnalysis, RoiBenchmark, RoiInputs, RoiResults } from "@/app/[lang]/roi-calculator/types";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";

// Node runtime — keeps GEMINI_API_KEY server-side. Copy the key from the old
// portfolio's .env into this project's env as GEMINI_API_KEY (never commit it).
export const runtime = "nodejs";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]; // primary → fallback
const TEXT_MAX_OUTPUT_TOKENS = 1200;
const ROI_MAX_OUTPUT_TOKENS = 2048;

// Client-facing error copy. The client renders `data.error` verbatim, so an
// English string would leak onto an Estonian page — localize it here, where
// the request's locale is known.
const ERRORS: Record<Locale, Record<string, string>> = {
  et: {
    notConfigured: "AI ei ole seadistatud.",
    invalidJson: "Vigane päringu keha.",
    invalidPayload: "Vigased päringu andmed.",
    failed: "AI päring ebaõnnestus. Proovi mõne hetke pärast uuesti.",
  },
  en: {
    notConfigured: "AI is not configured.",
    invalidJson: "Invalid JSON body.",
    invalidPayload: "Invalid request payload.",
    failed: "The AI request failed. Please try again in a moment.",
  },
};

function readLocale(body: Record<string, unknown> | null): Locale {
  const raw = body && typeof body.lang === "string" ? body.lang : "";
  return isLocale(raw) ? raw : defaultLocale;
}

// Language directive — the model must answer in the site's language
// regardless of what language the input data happens to be in.
const LANGUAGE_DIRECTIVE: Record<Locale, string> = {
  et: "KEEL: Kirjuta KOGU vastus eesti keeles — iga sõna, pealkiri, punkt ja soovitus. Ära kasuta ingliskeelseid lauseid ega tõlkimata terminieid (erandiks on väljakujunenud lühendid nagu ROI, CFO, AI).",
  en: "LANGUAGE: Write the entire response in English.",
};

// Anti-slop rules. The Estonian set is written natively — it is NOT a
// translation of the English one, because the English banned-phrase list is
// English idiom and means nothing to a model writing Estonian.
const HUMANIZE_RULES: Record<Locale, string> = {
  et: [
    "Kirjuta nagu terane, otsekohene ärikonsultant — mitte nagu reklaamitekst.",
    'Ära kunagi kasuta: "tänapäeva kiires maailmas", "vabasta potentsiaal", "murranguline", "revolutsiooniline", "sünergia", "terviklik lahendus", "viib teie ettevõtte järgmisele tasemele", "oluline on märkida", "kokkuvõtteks", "sukeldume".',
    "Ära venita teksti kolmikloeteludega, kui üks-kaks konkreetset punkti ütlevad sama selgemini.",
    "Kasuta allolevatest andmetest pärit konkreetseid numbreid, mitte ähmaseid omadussõnu nagu 'märkimisväärne' või 'oluline'.",
    "Eelista lihtsaid tegusõnu (vähendab, säästab, lisab, riskib, maksab) paisutatute asemel (võimendab, rakendab, kiirendab).",
    "Varieeri lausepikkust — sega lühikesi otseseid lauseid pikematega. Väldi ühetaolist loetelurütmi.",
    "Kasuta tegevat tegumoodi. Ei mingit umbmäärast täitesõna ('võib väita, et', 'tasuks kaaluda').",
    "Kõla nagu inimene, kes on numbrid läbi lugenud, mitte nagu malli täitev masin.",
    "Kirjuta korrektset, loomulikku eesti keelt — mitte sõna-sõnalt tõlgitud inglise lauseehitust.",
  ].join("\n- "),
  en: [
    "Write like a sharp, plain-spoken business consultant — not a marketing writer.",
    'Never use: "in today\'s fast-paced world", "unlock", "leverage", "supercharge", "game-changer", "seamless", "robust solution", "it\'s important to note", "in conclusion", "delve into".',
    'Do not pad with rule-of-three lists ("X, Y, and Z") when one or two concrete points say it better.',
    "Use specific numbers pulled from the data below, not vague adjectives like 'significant' or 'substantial'.",
    "Prefer plain verbs (cut, save, add, risk, cost) over inflated ones (leverage, harness, drive).",
    "Vary sentence length — mix short, direct statements with longer ones. Avoid uniform, listicle rhythm.",
    "Active voice throughout. No hedging filler ('it could be argued that', 'one might consider').",
    "Sound like a person who has read the numbers, not a template filling in blanks.",
  ].join("\n- "),
};

// Estonian is more compound-heavy, so the same substance needs fewer words.
const ASSESSMENT_WORD_CAP: Record<Locale, number> = { et: 200, en: 240 };

// Build the prompt server-side from structured data — never from a client string.
function buildRoiPrompt(
  inputs: RoiInputs,
  results: RoiResults,
  benchmark: RoiBenchmark | null,
  lang: Locale
): string {
  const i = inputs;
  const r = results;
  const fmt = (v: number) => formatCurrency(v, lang);
  const totalFirstYearInvestment = i.initialCost + i.annualCost;

  const lines = [
    "You are a senior AI-implementation consultant reviewing a client's ROI model for an AI investment.",
    "Produce a structured JSON analysis (the schema is enforced separately — just fill in good content).",
    "",
    LANGUAGE_DIRECTIVE[lang],
    "",
    "HUMANIZE THE WRITING:",
    `- ${HUMANIZE_RULES[lang]}`,
    "",
    "STRUCTURE REQUIREMENTS:",
    '- perspectives: exactly 4 entries. The "lens" field MUST be one of these exact uppercase keys, in this order: "FINANCIAL", "OPERATIONAL", "GROWTH", "RISK". Never translate or reword these keys — they are machine identifiers, not display text. The summary and points, however, must be written in the response language. FINANCIAL covers payback/cashflow, OPERATIONAL covers headcount/workflow/change management, GROWTH covers revenue/market/customer impact, RISK covers assumptions and downside. Each needs a 1-2 sentence summary and 3-4 bullet points grounded in the numbers below.',
    '- risks: 5 to 6 entries, each a specific risk plus a concrete mitigation (not "monitor closely" — name the actual action).',
    "- recommendations: 4 to 5 entries, each a short imperative title plus one implementation detail.",
    "- nextStep: one sentence, a direct call to action inviting a consultation to pressure-test the plan.",
    "- verdict: PROCEED if the numbers are strong and assumptions look reasonable, PROCEED_WITH_CAUTION if there are real but manageable risks, RECONSIDER if the investment doesn't pencil out or assumptions look shaky. These three values are machine identifiers — return them exactly, untranslated.",
    "- confidence: 0-100, how confident you are in the verdict given the inputs provided (not the ROI size itself).",
    "- headline: one punchy sentence stating the bottom line in plain language, with a real number in it.",
    "",
    "BUSINESS CONTEXT:",
    `Industry: ${i.industry}`,
    `Initial setup cost: ${fmt(i.initialCost)}, Annual subscription: ${fmt(i.annualCost)} (total first-year investment: ${fmt(totalFirstYearInvestment)})`,
    `${i.numEmployees} employees, ${i.hoursPerWeek} hrs/week on the target task, ${fmt(i.hourlyWage)}/hr average wage, ${i.timeSavings}% of that time expected to be saved`,
    `Current annual revenue: ${fmt(i.annualRevenue)}, expected revenue increase from this investment: ${i.revenueIncrease}%`,
    "",
    "CALCULATED RESULTS:",
    `First-year ROI: ${Number.isFinite(r.roi) ? r.roi.toFixed(1) + "%" : "infinite (near-zero investment)"}`,
    `Net gain (year 1): ${fmt(r.netFirstYearGain)}`,
    `Total annual gain: ${fmt(r.totalAnnualGain)} (cost savings ${fmt(r.annualCostSavings)} + revenue gain ${fmt(r.annualRevenueGain)})`,
    `5-year cumulative net-return trajectory (year 1 to 5): ${r.projection.map((v) => fmt(v)).join(", ")}`,
  ];

  if (benchmark) {
    lines.push(
      "",
      "INDUSTRY BENCHMARK:",
      `Average ROI for ${i.industry}: ${benchmark.avgROI}%, average time savings: ${benchmark.avgTimeSavings}%, average revenue increase: ${benchmark.avgRevenueIncrease}%`
    );
  }

  lines.push(
    "",
    "All monetary figures are in EUR. Ground every claim in the numbers above. If an assumption looks aggressive (e.g. time-savings % or revenue-increase % well above the industry benchmark), say so plainly in the RISK perspective or risks list."
  );

  return lines.join("\n");
}

function buildAssessmentPrompt(body: Record<string, unknown>, lang: Locale): string | null {
  const answers = body.answers as { area: string; score: number }[];
  if (!Array.isArray(answers)) return null;
  const lines = answers.map((a) => `- ${a.area}: ${a.score}/5`).join("\n");
  return [
    "You are an AI transformation advisor. An organization completed a 10-dimension AI-readiness assessment.",
    "",
    LANGUAGE_DIRECTIVE[lang],
    "",
    "HUMANIZE THE WRITING:",
    `- ${HUMANIZE_RULES[lang]}`,
    "",
    `Overall score: ${body.score}/100 (tier: ${body.tier}).`,
    "Dimension scores (1–5):",
    lines,
    "",
    `Write a focused action plan (max ~${ASSESSMENT_WORD_CAP[lang]} words): a one-paragraph read of where they stand, then a prioritized 90-day plan targeting the lowest-scoring dimensions first, as short bullets. Practical and specific. No large markdown headers.`,
  ].join("\n");
}

// OpenAPI-subset schema Gemini's responseSchema accepts (uppercase type names).
const ROI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["PROCEED", "PROCEED_WITH_CAUTION", "RECONSIDER"] },
    headline: { type: "STRING" },
    confidence: { type: "NUMBER" },
    perspectives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          // Stable machine key — enforced by the schema so a localized prompt
          // can never change it. The client maps key → icon + display label.
          lens: { type: "STRING", enum: ["FINANCIAL", "OPERATIONAL", "GROWTH", "RISK"] },
          summary: { type: "STRING" },
          points: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["lens", "summary", "points"],
      },
    },
    risks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          risk: { type: "STRING" },
          mitigation: { type: "STRING" },
        },
        required: ["risk", "mitigation"],
      },
    },
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
        },
        required: ["title", "detail"],
      },
    },
    nextStep: { type: "STRING" },
  },
  required: ["verdict", "headline", "confidence", "perspectives", "risks", "recommendations", "nextStep"],
} as const;

async function callGeminiText(model: string, key: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const generationConfig: Record<string, unknown> = {
    temperature: 0.6,
    maxOutputTokens: TEXT_MAX_OUTPUT_TOKENS,
  };
  if (model.includes("2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini ${model} failed (${res.status})`);
  }
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("");
  return text?.trim() || "";
}

async function callGeminiJSON(model: string, key: string, prompt: string): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const generationConfig: Record<string, unknown> = {
    temperature: 0.6,
    maxOutputTokens: ROI_MAX_OUTPUT_TOKENS,
    responseMimeType: "application/json",
    responseSchema: ROI_RESPONSE_SCHEMA,
  };
  if (model.includes("2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini ${model} failed (${res.status})`);
  }
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("");
  if (!text) throw new Error(`Empty response from ${model}`);
  return JSON.parse(text);
}

const LENS_KEYS = ["FINANCIAL", "OPERATIONAL", "GROWTH", "RISK"];

function isValidRoiAnalysis(v: unknown): v is RoiAnalysis {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  const perspectivesOk =
    Array.isArray(a.perspectives) &&
    a.perspectives.length > 0 &&
    a.perspectives.every(
      (p) => p && typeof p === "object" && LENS_KEYS.includes((p as { lens?: unknown }).lens as string)
    );
  return (
    typeof a.verdict === "string" &&
    ["PROCEED", "PROCEED_WITH_CAUTION", "RECONSIDER"].includes(a.verdict) &&
    typeof a.headline === "string" &&
    typeof a.confidence === "number" &&
    perspectivesOk &&
    Array.isArray(a.risks) &&
    a.risks.length > 0 &&
    Array.isArray(a.recommendations) &&
    a.recommendations.length > 0 &&
    typeof a.nextStep === "string"
  );
}

async function handleRoi(body: Record<string, unknown>, key: string, lang: Locale) {
  const inputs = body.inputs as RoiInputs;
  const results = body.results as RoiResults;
  const benchmark = (body.benchmark as RoiBenchmark | null | undefined) ?? null;
  if (!inputs || !results || !Array.isArray(results.projection)) {
    return NextResponse.json({ error: ERRORS[lang].invalidPayload }, { status: 400 });
  }

  const prompt = buildRoiPrompt(inputs, results, benchmark, lang);

  let lastErr = "";
  for (const model of MODELS) {
    try {
      const parsed = await callGeminiJSON(model, key, prompt);
      if (isValidRoiAnalysis(parsed)) {
        return NextResponse.json({ analysis: parsed, model });
      }
      lastErr = `Malformed JSON shape from ${model}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : `Gemini ${model} request failed`;
    }
  }
  console.error("[gemini] roi failed:", lastErr);
  return NextResponse.json({ error: ERRORS[lang].failed }, { status: 502 });
}

async function handleAssessment(body: Record<string, unknown>, key: string, lang: Locale) {
  const prompt = buildAssessmentPrompt(body, lang);
  if (!prompt) {
    return NextResponse.json({ error: ERRORS[lang].invalidPayload }, { status: 400 });
  }

  let lastErr = "";
  for (const model of MODELS) {
    try {
      const text = await callGeminiText(model, key, prompt);
      if (text) return NextResponse.json({ text, model });
      lastErr = `Empty response from ${model}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "Gemini request failed";
    }
  }
  console.error("[gemini] assessment failed:", lastErr);
  return NextResponse.json({ error: ERRORS[lang].failed }, { status: 502 });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: ERRORS[defaultLocale].invalidJson }, { status: 400 });
  }

  const lang = readLocale(body);

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: ERRORS[lang].notConfigured }, { status: 503 });
  }
  if (!body) {
    return NextResponse.json({ error: ERRORS[lang].invalidPayload }, { status: 400 });
  }

  if (body.kind === "roi") return handleRoi(body, key, lang);
  if (body.kind === "assessment") return handleAssessment(body, key, lang);
  return NextResponse.json({ error: ERRORS[lang].invalidPayload }, { status: 400 });
}
