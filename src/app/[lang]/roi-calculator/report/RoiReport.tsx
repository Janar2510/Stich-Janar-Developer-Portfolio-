import { Document, Page, View, Text, StyleSheet, Svg, Line, Path, Circle, Polyline } from "@react-pdf/renderer";
import type { RoiAnalysis, RoiInputs, RoiResults, Verdict } from "../types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatCurrency, formatDate } from "@/lib/format";
import { SEMANTIC_COLORS } from "@/lib/colors";

type RoiDict = Dictionary["roiCalculator"];

// Branded PDF report — dark theme mirroring the site's design tokens
// (--color-accent #FF4800, surface-low/mid/high, dark bg). Pattern follows
// /Users/janarkuusk/kingspan-eesti-bio/src/documents/ (StyleSheet + Page +
// View/Text/Svg primitives), rewritten in idiomatic TSX for this repo.

const ACCENT = "#FF4800";
const BG = "#0D0D0D";
const SURFACE_LOW = "#050505";
const SURFACE_MID = "#141414";
const SURFACE_HIGH = "#1c1c1c";
const OUTLINE = "#2e2e2e";
const TEXT = "#EDEDED";
const SUBTLE = "#c4c4c4";
const MUTED = "#8a8a8a";
const FAINT = "#5c5c5c";
const RING_TRACK = "#3f3f46";

const VERDICT_COLOR: Record<Verdict, string> = {
  PROCEED: SEMANTIC_COLORS.success,
  PROCEED_WITH_CAUTION: SEMANTIC_COLORS.warning,
  RECONSIDER: SEMANTIC_COLORS.danger,
};
const fmtPct = (v: number) => (Number.isFinite(v) ? `${v.toFixed(1)}%` : "∞");

// Explicit arc path (start at 12 o'clock, sweep clockwise). Built by hand
// rather than a rotated <Circle strokeDasharray>: react-pdf's SVG-to-PDF
// renderer doesn't treat a Circle's start point the way browsers do, so a
// rotate-transform trick that works in charts.tsx renders offset here.
function arcPath(cx: number, cy: number, r: number, sweepDeg: number): string {
  const clamped = Math.max(0, Math.min(360, sweepDeg));
  if (clamped <= 0.01) return "";
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pointAt = (deg: number) => [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))] as const;
  const startAngle = -90; // 12 o'clock
  if (clamped >= 359.99) {
    // A single <path> arc command can't sweep a full circle — split into two semicircles.
    const [topX, topY] = pointAt(startAngle);
    const [botX, botY] = pointAt(startAngle + 180);
    return `M${topX.toFixed(2)},${topY.toFixed(2)} A${r},${r} 0 1 1 ${botX.toFixed(2)},${botY.toFixed(2)} A${r},${r} 0 1 1 ${topX.toFixed(2)},${topY.toFixed(2)}`;
  }
  const [startX, startY] = pointAt(startAngle);
  const [endX, endY] = pointAt(startAngle + clamped);
  const largeArc = clamped > 180 ? 1 : 0;
  return `M${startX.toFixed(2)},${startY.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${endX.toFixed(2)},${endY.toFixed(2)}`;
}

// Same payback math as charts.tsx, duplicated (no framer-motion / "use
// client" dependency here — this file renders inside a Node API route).
function computePayback(initialCost: number, projection: number[]): number | null {
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

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    color: TEXT,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    paddingHorizontal: 40,
    paddingVertical: 36,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEXT, letterSpacing: 1 },
  brandSub: { fontSize: 7.5, color: MUTED, marginTop: 4, letterSpacing: 0.8 },
  docType: { fontSize: 10.5, color: ACCENT, fontFamily: "Helvetica-Bold", textAlign: "right", letterSpacing: 1.2 },
  docMeta: { fontSize: 7.5, color: MUTED, textAlign: "right", marginTop: 3 },
  rule: { height: 1.5, backgroundColor: ACCENT, marginVertical: 14 },

  sectionTitle: { fontSize: 8, color: MUTED, letterSpacing: 1.4, marginBottom: 8, marginTop: 16, textTransform: "uppercase" },

  verdictBox: { borderWidth: 1, padding: 16, marginBottom: 4 },
  verdictTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  verdictLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  confidenceLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 1 },
  headline: { fontSize: 13, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 10, lineHeight: 1.35 },
  meterTrack: { height: 4, backgroundColor: SURFACE_HIGH },
  meterFill: { height: 4 },

  inputsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  inputCell: { width: "33.33%", paddingHorizontal: 6, marginBottom: 10 },
  inputLabel: { fontSize: 6.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  inputValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: TEXT },

  metricGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  metricCell: { width: "20%", paddingHorizontal: 5, marginBottom: 4 },
  metricBox: { backgroundColor: SURFACE_LOW, borderWidth: 0.5, borderColor: OUTLINE, padding: 8, minHeight: 52 },
  metricLabel: { fontSize: 6, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ACCENT },

  chartBox: { backgroundColor: SURFACE_LOW, borderWidth: 0.5, borderColor: OUTLINE, padding: 14, marginBottom: 4 },
  chartCaption: { fontSize: 7.5, color: ACCENT, marginTop: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.6 },
  yearRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingHorizontal: 2 },
  yearLabel: { fontSize: 6, color: FAINT },

  splitRow: { flexDirection: "row", alignItems: "center" },
  splitLegend: { marginLeft: 22 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  legendSwatch: { width: 7, height: 7, marginRight: 7 },
  legendLabel: { fontSize: 6.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  legendValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT },

  perspectiveGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  perspectiveCell: { width: "50%", paddingHorizontal: 6, marginBottom: 12 },
  perspectiveBox: { backgroundColor: SURFACE_LOW, borderWidth: 0.5, borderColor: OUTLINE, padding: 12, minHeight: 118 },
  perspectiveLens: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 6 },
  perspectiveSummary: { fontSize: 7.8, color: SUBTLE, lineHeight: 1.4, marginBottom: 6 },
  bulletRow: { flexDirection: "row", marginBottom: 3 },
  bulletMark: { fontSize: 8, color: ACCENT, marginRight: 5 },
  bulletText: { fontSize: 7.3, color: MUTED, lineHeight: 1.35, flex: 1 },

  riskGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  riskCell: { width: "50%", paddingHorizontal: 6, marginBottom: 10 },
  riskTitle: {
    fontSize: 8.3,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 3,
    borderLeftWidth: 1.5,
    borderLeftColor: OUTLINE,
    paddingLeft: 7,
  },
  riskMitigation: { fontSize: 7.3, color: MUTED, lineHeight: 1.35, paddingLeft: 8.5 },

  recRow: { flexDirection: "row", marginBottom: 9 },
  recNum: { fontSize: 12, fontFamily: "Helvetica-Bold", color: ACCENT, width: 22 },
  recBody: { flex: 1 },
  recTitle: { fontSize: 8.8, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 2 },
  recDetail: { fontSize: 7.3, color: MUTED, lineHeight: 1.35 },

  ctaBox: { backgroundColor: SURFACE_MID, borderWidth: 0.5, borderColor: OUTLINE, padding: 14, marginTop: 14 },
  ctaText: { fontSize: 8.8, color: SUBTLE, lineHeight: 1.4, marginBottom: 10 },
  ctaFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ctaLabel: { fontSize: 7.5, color: ACCENT, fontFamily: "Helvetica-Bold", letterSpacing: 1 },

  disclaimer: { fontSize: 6.3, color: FAINT, lineHeight: 1.4, marginTop: 14 },

  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: OUTLINE,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 6.8, color: FAINT },
});

function InputCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.inputCell}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Text style={styles.inputValue}>{value}</Text>
    </View>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

export interface RoiReportProps {
  inputs: RoiInputs;
  results: RoiResults;
  analysis: RoiAnalysis;
  lang: Locale;
  dict: RoiDict;
}

export default function RoiReport({ inputs, results, analysis, lang, dict }: RoiReportProps) {
  const rep = dict.report;
  const fmtCurrency = (v: number) => formatCurrency(v, lang);
  const verdictColor = VERDICT_COLOR[analysis.verdict] ?? ACCENT;
  const confidence = Math.max(0, Math.min(100, analysis.confidence));
  const payback = computePayback(inputs.initialCost, results.projection);
  const paybackLabel =
    payback === null
      ? rep.payback.beyond
      : payback <= 0.05
        ? rep.payback.immediate
        : rep.payback.approxTemplate.replace("{n}", payback.toFixed(1));

  // Cumulative net-return chart geometry
  const cumulative = [-inputs.initialCost, ...results.projection];
  const max = Math.max(...cumulative, 0);
  const min = Math.min(...cumulative, 0);
  const range = max - min || 1;
  const W = 500;
  const H = 120;
  const PAD = 8;
  const xAt = (i: number) => (i / (cumulative.length - 1)) * W;
  const yAt = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);
  const linePoints = cumulative.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
  const areaPath = `M${cumulative
    .map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    .join(" L")} L${W},${H} L0,${H} Z`;
  const zeroY = yAt(0);
  const paybackX = payback !== null ? xAt(payback) : null;

  // Cost-savings vs revenue-gain donut geometry
  const total = Math.max(results.annualCostSavings + results.annualRevenueGain, 1);
  const pctCost = (Math.max(results.annualCostSavings, 0) / total) * 100;
  const R = 33;
  const donutCenter = 44;
  const costArcPath = arcPath(donutCenter, donutCenter, R, (pctCost / 100) * 360);

  const dateStr = formatDate(new Date(), lang);

  return (
    <Document title={`${rep.docType} — Janar Kuusk`} author="Janar Kuusk">
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>JANAR KUUSK</Text>
            <Text style={styles.brandSub}>{rep.brandSub}</Text>
          </View>
          <View>
            <Text style={styles.docType}>{rep.docType}</Text>
            <Text style={styles.docMeta}>{dateStr}</Text>
            <Text style={styles.docMeta}>{inputs.industry.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        {/* Verdict */}
        <View style={[styles.verdictBox, { borderColor: verdictColor }]}>
          <View style={styles.verdictTop}>
            <Text style={[styles.verdictLabel, { color: verdictColor }]}>{dict.verdicts[analysis.verdict]}</Text>
            <Text style={styles.confidenceLabel}>{dict.aiAnalysis.confidence} {Math.round(confidence)}%</Text>
          </View>
          <Text style={styles.headline}>{analysis.headline}</Text>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${confidence}%`, backgroundColor: verdictColor }]} />
          </View>
        </View>

        {/* Inputs */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.investmentModel}</Text>
        <View style={styles.inputsGrid}>
          <InputCell label={rep.inputLabels.industry} value={inputs.industry} />
          <InputCell label={rep.inputLabels.initialSetup} value={fmtCurrency(inputs.initialCost)} />
          <InputCell label={rep.inputLabels.annualSubscription} value={fmtCurrency(inputs.annualCost)} />
          <InputCell label={rep.inputLabels.employees} value={String(inputs.numEmployees)} />
          <InputCell label={rep.inputLabels.hourlyWage} value={fmtCurrency(inputs.hourlyWage)} />
          <InputCell label={rep.inputLabels.hoursPerWeek} value={String(inputs.hoursPerWeek)} />
          <InputCell label={rep.inputLabels.timeSavings} value={`${inputs.timeSavings}%`} />
          <InputCell label={rep.inputLabels.annualRevenue} value={fmtCurrency(inputs.annualRevenue)} />
          <InputCell label={rep.inputLabels.revenueIncrease} value={`${inputs.revenueIncrease}%`} />
        </View>

        {/* Metrics */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.results}</Text>
        <View style={styles.metricGrid}>
          <MetricCell label={rep.metricLabels.firstYearRoi} value={fmtPct(results.roi)} />
          <MetricCell label={rep.metricLabels.netGainYr1} value={fmtCurrency(results.netFirstYearGain)} />
          <MetricCell label={rep.metricLabels.totalAnnualGain} value={fmtCurrency(results.totalAnnualGain)} />
          <MetricCell label={rep.metricLabels.costSavingsPerYr} value={fmtCurrency(results.annualCostSavings)} />
          <MetricCell label={rep.metricLabels.revenueGainPerYr} value={fmtCurrency(results.annualRevenueGain)} />
        </View>

        {/* Cumulative net-return chart */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.cumulativeReturn}</Text>
        <View style={styles.chartBox}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={OUTLINE} strokeWidth={1} strokeDasharray="4 4" />
            <Path d={areaPath} fill={ACCENT} fillOpacity={0.16} />
            <Polyline
              points={linePoints}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {paybackX !== null && <Circle cx={paybackX} cy={zeroY} r={3.5} fill={BG} stroke={ACCENT} strokeWidth={2} />}
          </Svg>
          <View style={styles.yearRow}>
            {rep.yearLabels.map((l) => (
              <Text key={l} style={styles.yearLabel}>{l}</Text>
            ))}
          </View>
          <Text style={styles.chartCaption}>{rep.payback.prefix} {paybackLabel}</Text>
        </View>

        {/* Cost savings vs revenue gain split */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.costSplit}</Text>
        <View style={[styles.chartBox, styles.splitRow]}>
          <Svg width={88} height={88} viewBox="0 0 88 88">
            <Circle cx={donutCenter} cy={donutCenter} r={R} fill="none" stroke={RING_TRACK} strokeWidth={11} />
            {costArcPath && (
              <Path d={costArcPath} fill="none" stroke={ACCENT} strokeWidth={11} strokeLinecap="butt" />
            )}
          </Svg>
          <View style={styles.splitLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: ACCENT }]} />
              <View>
                <Text style={styles.legendLabel}>{rep.metricLabels.costSavingsPerYr}</Text>
                <Text style={styles.legendValue}>
                  {fmtCurrency(results.annualCostSavings)} ({pctCost.toFixed(0)}%)
                </Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: RING_TRACK }]} />
              <View>
                <Text style={styles.legendLabel}>{rep.metricLabels.revenueGainPerYr}</Text>
                <Text style={styles.legendValue}>
                  {fmtCurrency(results.annualRevenueGain)} ({(100 - pctCost).toFixed(0)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Four-perspective analysis */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.fourPerspective}</Text>
        <View style={styles.perspectiveGrid}>
          {analysis.perspectives.map((p) => (
            <View key={p.lens} style={styles.perspectiveCell} wrap={false}>
              <View style={styles.perspectiveBox}>
                <Text style={styles.perspectiveLens}>{dict.lensLabels[p.lens] ?? p.lens}</Text>
                <Text style={styles.perspectiveSummary}>{p.summary}</Text>
                {p.points.map((pt, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletMark}>{"›"}</Text>
                    <Text style={styles.bulletText}>{pt}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Risks & mitigations */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.risksMitigations}</Text>
        <View style={styles.riskGrid}>
          {analysis.risks.map((risk, i) => (
            <View key={i} style={styles.riskCell} wrap={false}>
              <Text style={styles.riskTitle}>{risk.risk}</Text>
              <Text style={styles.riskMitigation}>{risk.mitigation}</Text>
            </View>
          ))}
        </View>

        {/* Strategic recommendations */}
        <Text style={styles.sectionTitle}>{rep.sectionTitles.strategicRecommendations}</Text>
        {analysis.recommendations.map((rec, i) => (
          <View key={i} style={styles.recRow} wrap={false}>
            <Text style={styles.recNum}>{String(i + 1).padStart(2, "0")}</Text>
            <View style={styles.recBody}>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recDetail}>{rec.detail}</Text>
            </View>
          </View>
        ))}

        {/* Consultation CTA */}
        <View style={styles.ctaBox} wrap={false}>
          <Text style={styles.ctaText}>{analysis.nextStep}</Text>
          <View style={styles.ctaFooterRow}>
            <Text style={styles.ctaLabel}>{rep.ctaLabel}</Text>
            <Text style={styles.ctaLabel}>info@janarkuuskpro.com</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>{rep.disclaimer}</Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{rep.footerText}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
