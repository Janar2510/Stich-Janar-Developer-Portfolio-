// Shared types for the ROI calculator — inputs/results/AI analysis shape.
// Imported by the client (RoiCalculator, charts, RoiReport) and the two
// server routes (api/gemini, api/report) so the contract stays in one place.

export interface RoiInputs {
  industry: string;
  initialCost: number;
  annualCost: number;
  numEmployees: number;
  hoursPerWeek: number;
  hourlyWage: number;
  timeSavings: number;
  annualRevenue: number;
  revenueIncrease: number;
}

export interface RoiResults {
  annualCostSavings: number;
  annualRevenueGain: number;
  totalAnnualGain: number;
  netFirstYearGain: number;
  roi: number;
  projection: number[];
}

export interface RoiBenchmark {
  avgROI: number;
  avgTimeSavings: number;
  avgRevenueIncrease: number;
}

export type Verdict = "PROCEED" | "PROCEED_WITH_CAUTION" | "RECONSIDER";

// Stable enum — never localize this value itself. Gemini returns one of
// these four keys; the client maps key → icon (LENS_ICON) and key →
// localized display label (dict.roiCalculator.lensLabels). Previously the
// prompt asked Gemini to return the display string directly ("Financial
// (CFO)"), which broke the moment the prompt was localized: an Estonian
// lens name wouldn't match the English-keyed icon lookup and every card
// silently fell back to the generic "insights" icon.
export type LensKey = "FINANCIAL" | "OPERATIONAL" | "GROWTH" | "RISK";

export interface RoiPerspective {
  lens: LensKey;
  summary: string;
  points: string[];
}

export interface RoiRisk {
  risk: string;
  mitigation: string;
}

export interface RoiRecommendation {
  title: string;
  detail: string;
}

export interface RoiAnalysis {
  verdict: Verdict;
  headline: string;
  confidence: number;
  perspectives: RoiPerspective[];
  risks: RoiRisk[];
  recommendations: RoiRecommendation[];
  nextStep: string;
}
