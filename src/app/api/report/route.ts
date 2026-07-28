import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import RoiReport from "@/app/[lang]/roi-calculator/report/RoiReport";
import type { RoiAnalysis, RoiInputs, RoiResults } from "@/app/[lang]/roi-calculator/types";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

// Node runtime — @react-pdf/renderer needs Node APIs (Buffer, streams), not the Edge runtime.
export const runtime = "nodejs";

// Client-facing copy — localized here, where the request's locale is known.
const ERRORS: Record<Locale, Record<string, string>> = {
  et: {
    invalidJson: "Vigane päringu keha.",
    invalidPayload: "Vigased päringu andmed.",
    failed: "PDF-i loomine ebaõnnestus.",
  },
  en: {
    invalidJson: "Invalid JSON body.",
    invalidPayload: "Invalid request payload.",
    failed: "PDF generation failed.",
  },
};

const FILENAME: Record<Locale, string> = {
  et: "janar-kuusk-ai-roi-raport.pdf",
  en: "janar-kuusk-ai-roi-report.pdf",
};

function isValidInputs(v: unknown): v is RoiInputs {
  if (!v || typeof v !== "object") return false;
  const i = v as Record<string, unknown>;
  return (
    typeof i.industry === "string" &&
    typeof i.initialCost === "number" &&
    typeof i.annualCost === "number" &&
    typeof i.numEmployees === "number" &&
    typeof i.hoursPerWeek === "number" &&
    typeof i.hourlyWage === "number" &&
    typeof i.timeSavings === "number" &&
    typeof i.annualRevenue === "number" &&
    typeof i.revenueIncrease === "number"
  );
}

function isValidResults(v: unknown): v is RoiResults {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.annualCostSavings === "number" &&
    typeof r.annualRevenueGain === "number" &&
    typeof r.totalAnnualGain === "number" &&
    typeof r.netFirstYearGain === "number" &&
    typeof r.roi === "number" &&
    Array.isArray(r.projection)
  );
}

function isValidAnalysis(v: unknown): v is RoiAnalysis {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a.verdict === "string" &&
    typeof a.headline === "string" &&
    typeof a.confidence === "number" &&
    Array.isArray(a.perspectives) &&
    Array.isArray(a.risks) &&
    Array.isArray(a.recommendations) &&
    typeof a.nextStep === "string"
  );
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: ERRORS[defaultLocale].invalidJson }, { status: 400 });
  }

  const rawLang = typeof body.lang === "string" ? body.lang : "";
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;

  const inputs = body.inputs;
  const results = body.results;
  const analysis = body.analysis;

  if (!isValidInputs(inputs) || !isValidResults(results) || !isValidAnalysis(analysis)) {
    return NextResponse.json({ error: ERRORS[lang].invalidPayload }, { status: 400 });
  }

  try {
    const dict = await getDictionary(lang);
    // Call the component directly (not via createElement/JSX) — it's a pure
    // render function with no hooks, so this just returns the <Document>
    // element it builds, which is what renderToBuffer expects.
    const buffer = await renderToBuffer(RoiReport({ inputs, results, analysis, lang, dict: dict.roiCalculator }));
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${FILENAME[lang]}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    console.error("[report] PDF generation failed:", e);
    return NextResponse.json({ error: ERRORS[lang].failed }, { status: 500 });
  }
}
