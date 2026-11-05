import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DataDataset,
  OpportunityItem,
  ProcessStageAssessment,
  ReportConfigState,
  RoadmapInitiative,
  RootCauseItem,
} from "./types";
import type {
  KpiBenchmarkDetail,
  ValueRealizationSummary,
  deriveCoreMetrics,
} from "./calculations";

const NAVY: [number, number, number] = [13, 27, 46];
const CHARCOAL: [number, number, number] = [30, 41, 59];
const YELLOW: [number, number, number] = [255, 230, 0];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_200: [number, number, number] = [226, 232, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [15, 23, 42];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 12;

export async function exportStudioExecutivePdf(params: {
  clientName: string;
  engagementName: string;
  reportConfig: ReportConfigState;
  coreMetrics: ReturnType<typeof deriveCoreMetrics>;
  kpiBenchmarks: KpiBenchmarkDetail[];
  processStages: ProcessStageAssessment[];
  rootCauses: RootCauseItem[];
  opportunities: OpportunityItem[];
  valueSummary: ValueRealizationSummary;
  roadmapInitiatives: RoadmapInitiative[];
  datasets: DataDataset[];
}) {
  const {
    clientName,
    reportConfig,
    coreMetrics,
    kpiBenchmarks,
    processStages,
    rootCauses,
    opportunities,
    valueSummary,
    roadmapInitiatives,
    datasets,
  } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 1. COVER PAGE
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Subtle geometric accent bar
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN, 28, 32, 3, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AP DIAGNOSTIC STUDIO  |  ENTERPRISE FINANCE TRANSFORMATION", MARGIN, 40);

  // Yellow Title Block per consulting deck spec
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN, 52, CONTENT_W, 56, "F");

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`CLIENT: ${clientName.toUpperCase()}`, MARGIN + 8, 66);

  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(reportConfig.reportTitle, CONTENT_W - 16);
  doc.text(titleLines, MARGIN + 8, 78);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(reportConfig.subtitle, MARGIN + 8, 98);

  // Cover Executive KPI Snapshot Box
  doc.setFillColor(22, 38, 62);
  doc.rect(MARGIN, 125, CONTENT_W, 52, "F");
  doc.setTextColor(...YELLOW);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("EXECUTIVE DIAGNOSTIC SNAPSHOT (ILLUSTRATIVE BASELINE)", MARGIN + 8, 136);

  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    [
      `• Annual Invoice Volume: ${coreMetrics.annualInvoices.toLocaleString()} (${coreMetrics.monthlyInvoices.toLocaleString()}/mo) across ${coreMetrics.ftes} AP FTEs`,
      `• Current PO-Backed Rate: ${coreMetrics.poBackedRate}%  |  Touchless Rate: ${coreMetrics.touchlessRate}%  |  Exception Rate: ${coreMetrics.exceptionRate}%`,
      `• Processing Cycle Time: ${coreMetrics.cycleTimeDays.toFixed(1)} days  |  On-Time Payment: ${coreMetrics.onTimePaymentRate}%  |  Discount Capture: ${coreMetrics.discountCaptureRate}%`,
      `• Gross Annual Value Case (${valueSummary.scenario}): $${valueSummary.grossAnnualBenefitUsd.toLocaleString()}/yr  |  Payback: ${valueSummary.paybackMonths} months`,
    ],
    MARGIN + 8,
    145,
  );

  // Cover Metadata at bottom
  doc.setTextColor(180, 192, 210);
  doc.setFontSize(9);
  doc.text(`Prepared For: ${reportConfig.preparedFor}`, MARGIN, 245);
  doc.text(`Prepared By: ${reportConfig.preparedBy}`, MARGIN, 252);
  doc.text(`Date Generated: ${today}`, MARGIN, 259);
  doc.text(
    "Note: Generated from illustrative Harlow Industrial Components diagnostic data and synthetic peer benchmarks.",
    MARGIN,
    270,
  );

  // Start Page 2 for Content Sections
  doc.addPage();
  let y = MARGIN;

  const ensureSpace = (need: number) => {
    if (y + need > FOOTER_Y - 6) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const drawSectionBanner = (num: string, title: string) => {
    ensureSpace(18);
    y += 3;
    doc.setFillColor(...CHARCOAL);
    doc.rect(MARGIN, y, CONTENT_W, 9, "F");
    doc.setFillColor(...YELLOW);
    doc.rect(MARGIN, y, 2.5, 9, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${num}. ${title.toUpperCase()}`, MARGIN + 6, y + 6);
    y += 13;
  };

  const drawParagraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(...SLATE_700);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    ensureSpace(lines.length * 4.5 + 3);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4.5 + 3;
  };

  // 2. EXECUTIVE SUMMARY
  drawSectionBanner("02", "Executive Summary");
  drawParagraph(reportConfig.executiveSummaryText);

  // 3. CLIENT OVERVIEW & OPERATING MODEL
  drawSectionBanner("03", "Client Overview & Operating Scope");
  drawParagraph(reportConfig.clientOverviewText);

  // 4. AP CURRENT-STATE PERFORMANCE
  drawSectionBanner("04", "AP Current-State Performance Baseline");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Metric", "Current Baseline", "Peer Benchmark", "Best-in-Class", "Variance / Status"]],
    body: kpiBenchmarks.slice(0, 8).map((k) => [
      k.name,
      k.formattedClient,
      `${k.peerBenchmark} ${k.unit}`,
      `${k.bestInClassBenchmark} ${k.unit}`,
      `${k.classification} (${k.formattedGapVsPeer})`,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.3,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 5. DIAGNOSTIC FINDINGS & PROCESS ASSESSMENT
  drawSectionBanner("05", "12-Stage End-to-End Process Maturity Assessment");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Stage", "Current Maturity", "Target", "Automation %", "Primary Operational Pain Point"]],
    body: processStages.map((s) => [
      `${s.order}. ${s.name}`,
      `Level ${s.maturityScore} / 5`,
      `Level ${s.targetMaturityScore} / 5`,
      `${s.automationLevelPct}%`,
      s.painPoints[0] ?? "Standardized execution",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 6. BENCHMARK ANALYSIS
  drawSectionBanner("06", "Full Operational & Working Capital Benchmark Readout");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["KPI", "Client", "Industry", "Peer", "Best-in-Class", "Diagnostic Interpretation"]],
    body: kpiBenchmarks.map((k) => [
      k.shortName,
      k.formattedClient,
      String(k.industryBenchmark),
      String(k.peerBenchmark),
      String(k.bestInClassBenchmark),
      k.businessInterpretation,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.1,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 7. ROOT CAUSE ANALYSIS
  drawSectionBanner("07", "Root Cause Causal Chain Analysis");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["ID", "Category", "Root Cause & Causal Mechanism", "Annual Impact", "Primary Lever"]],
    body: rootCauses.map((rc) => [
      rc.code,
      rc.category,
      `${rc.title}: ${rc.rootCauseStatement}`,
      `$${rc.estimatedAnnualImpactUsd.toLocaleString()}/yr`,
      rc.improvementLever,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 8. AUTOMATION & AI OPPORTUNITIES
  drawSectionBanner("08", "Automation & AI Opportunity Portfolio");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Code", "Opportunity", "Type / AI Role", "Priority", "Est. Annual Value", "Status"]],
    body: opportunities.map((o) => [
      o.code,
      o.name,
      `${o.automationType} (${o.aiApplicability})`,
      o.priority,
      `$${o.estimatedAnnualBenefitUsd.toLocaleString()}/yr`,
      o.status,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 9. VALUE REALIZATION
  drawSectionBanner("09", `Value Realization Business Case (${valueSummary.scenario})`);
  drawParagraph(
    `Gross Annual Benefit: $${valueSummary.grossAnnualBenefitUsd.toLocaleString()}/yr  |  Net Annual Benefit (after $${valueSummary.recurringTechCostAnnualUsd.toLocaleString()}/yr recurring cost): $${valueSummary.netAnnualBenefitUsd.toLocaleString()}/yr  |  Implementation Investment: $${valueSummary.implementationCostUsd.toLocaleString()}  |  Payback Period: ${valueSummary.paybackMonths} months  |  3-Year Net Value: $${valueSummary.threeYearNetBenefitUsd.toLocaleString()} (${valueSummary.roiPct}% ROI).`,
  );
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Benefit Lever", "Classification", "Annual Value ($)", "Transparent Formula & Basis"]],
    body: valueSummary.categories.map((c) => [
      c.name,
      c.benefitType,
      `$${c.annualValueUsd.toLocaleString()}`,
      `${c.formulaText} — ${c.calculationDetail}`,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 10. TRANSFORMATION ROADMAP
  drawSectionBanner("10", "Phased 3-Wave Transformation Roadmap");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Code", "Wave", "Initiative", "Timeline", "Value ($/yr)", "Owner & Success KPI"]],
    body: roadmapInitiatives.map((i) => [
      i.code,
      i.wave,
      i.name,
      `${i.startDate} to ${i.endDate} (${i.effortWeeks}w)`,
      `$${i.businessValueUsd.toLocaleString()}`,
      `${i.owner} — ${i.successKpi}`,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 11. RISKS & DEPENDENCIES
  drawSectionBanner("11", "Implementation Risks, Governance & Sequencing Dependencies");
  drawParagraph(reportConfig.risksAndDependenciesText);

  // 12. RECOMMENDED NEXT STEPS
  drawSectionBanner("12", "Recommended Immediate Next Steps (30-60-90 Day Action Plan)");
  drawParagraph(reportConfig.keyRecommendationsText);
  drawParagraph(reportConfig.nextStepsNarrative);

  // 13. APPENDIX — EVIDENCE & DATASET REGISTER
  drawSectionBanner("13", "Appendix: Diagnostic Evidence & Dataset Register");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [["Dataset Type", "File Name", "Records", "Period", "Status", "Validation Notes"]],
    body: datasets.map((d) => [
      d.datasetType,
      d.fileName,
      d.records.toLocaleString(),
      d.dataPeriod,
      d.status,
      d.validationIssues.map((v) => `${v.label} (${v.count})`).join("; ") || "Verified clean",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.1,
      textColor: CHARCOAL,
      lineColor: SLATE_200,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: "bold",
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // 14. DATA SOURCES & ASSUMPTIONS
  drawSectionBanner("14", "Methodology, Data Sources & Modelling Assumptions");
  drawParagraph(reportConfig.assumptionsNoteText);

  // Page numbers & footer on all pages after cover
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_500);
    doc.text(`Page ${p} of ${totalPages}`, MARGIN, PAGE_H - 9);
    doc.text(`${clientName} — AP Transformation Diagnostic`, PAGE_W / 2, PAGE_H - 9, {
      align: "center",
    });
    doc.text(today, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" });
  }

  const slug = clientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "ap-studio";
  doc.save(`${slug}-executive-diagnostic-report.pdf`);
}
