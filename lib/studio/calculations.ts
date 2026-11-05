import type {
  BenchmarkFilterState,
  InterviewQuestion,
  KpiId,
  ProcessStageAssessment,
  ValueAssumptions,
  ValueScenario,
} from "./types";

export interface KpiBenchmarkDetail {
  id: KpiId;
  name: string;
  shortName: string;
  unit: string;
  betterDirection: "higher" | "lower" | "target-band";
  clientValue: number;
  formattedClient: string;
  industryBenchmark: number;
  peerBenchmark: number;
  bestInClassBenchmark: number;
  gapVsPeer: number;
  gapVsBestInClass: number;
  formattedGapVsPeer: string;
  classification: "Critical Gap" | "Below Peer" | "Near Peer" | "Outperforming";
  formula: string;
  dataSource: string;
  businessInterpretation: string;
  improvementOpportunity: string;
  potentialFinancialImpactUsd: number;
  linkedDatasetIds: string[];
  linkedRootCauseIds: string[];
  linkedOpportunityIds: string[];
  linkedStageIds: string[];
  monthlyTrend: Array<{ month: string; client: number; peer: number; bestInClass: number }>;
}

export function deriveCoreMetrics(
  questions: InterviewQuestion[],
  stages: ProcessStageAssessment[],
  assumptions: ValueAssumptions,
) {
  const getNum = (fieldCode: string, fallback: number): number => {
    const q = questions.find((item) => item.fieldCode === fieldCode);
    if (q && q.status === "answered") {
      const parsed = Number(String(q.answer).replace(/[^0-9.-]/g, ""));
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return fallback;
  };

  const answeredQuestions = questions.filter((q) => q.status === "answered");
  const answeredCount = answeredQuestions.length;
  const totalQuestions = questions.length;
  const answeredFieldCodes = answeredQuestions.map((q) => q.fieldCode);

  const activeVendors = getNum("ap_01", 3150);
  const monthlyInvoices = getNum("ap_03", Math.round(assumptions.annualInvoiceVolume / 12));
  const annualInvoices = monthlyInvoices * 12;
  const ftes = getNum("ap_19", assumptions.apHeadcount);
  const poBackedRate = getNum("ap_04", 62);
  const exceptionRate = getNum("ap_08", assumptions.exceptionRatePct);
  const cycleTimeDays = getNum("ap_09", 6.0);
  const onTimePaymentRate = getNum("ap_11", cycleTimeDays <= 3.8 ? 91 : cycleTimeDays >= 8 ? 68 : 81);
  const dpoDays = getNum("ap_10", 58);
  const discountCaptureRate = getNum("ap_14", assumptions.discountCaptureRatePct);
  const monthlyQueries = getNum("ap_17", assumptions.monthlyVendorQueries);
  const touchlessRate = getNum("ap_touchless", assumptions.currentAutomationRatePct);

  const invoicesPerFte = ftes > 0 ? Math.round(annualInvoices / ftes) : 16000;
  const vendorQueryRatePer1k =
    monthlyInvoices > 0 ? Math.round((monthlyQueries / monthlyInvoices) * 1000) : 75;

  const avgMaturity =
    stages.length > 0
      ? Math.round(
          (stages.reduce((sum, s) => sum + s.maturityScore, 0) / stages.length) * 10,
        ) / 10
      : 2.3;

  // Dynamic unit cost formula calibrated to $11.80 at Harlow baseline (144k inv, 9 FTEs, 18% exc, 34% touchless)
  const dynamicCost =
    (ftes * 98000) / Math.max(1, annualInvoices) +
    (exceptionRate / 100) * 18.5 +
    ((100 - touchlessRate) / 100) * 3.553;
  const costPerInvoice =
    answeredFieldCodes.some((c) => ["ap_03", "ap_19", "ap_08", "ap_touchless"].includes(c))
      ? Number(dynamicCost.toFixed(2))
      : assumptions.costPerInvoiceUsd;

  return {
    activeVendors,
    monthlyInvoices,
    annualInvoices,
    ftes,
    poBackedRate,
    exceptionRate,
    cycleTimeDays,
    onTimePaymentRate,
    dpoDays,
    discountCaptureRate,
    monthlyQueries,
    vendorQueryRatePer1k,
    touchlessRate,
    invoicesPerFte,
    avgMaturity,
    costPerInvoice,
    answeredCount,
    totalQuestions,
    answeredFieldCodes,
  };
}

export function computeAllKpiBenchmarks(
  questions: InterviewQuestion[],
  stages: ProcessStageAssessment[],
  assumptions: ValueAssumptions,
  filters: BenchmarkFilterState,
): KpiBenchmarkDetail[] {
  const m = deriveCoreMetrics(questions, stages, assumptions);

  // Filter adjustment factors so changing Industry / Region / Size / Complexity visibly refines peer benchmarks
  const regionThroughputMult =
    filters.region === "India & APAC SSC"
      ? 1.12
      : filters.region === "North America & Europe"
        ? 0.96
        : 1.0;

  const industryPoAdd =
    filters.industry === "Industrial Manufacturing"
      ? 0
      : filters.industry === "Life Sciences"
        ? 4
        : filters.industry === "Technology & Telecom"
          ? 2
          : -2;

  const sizeCostMult =
    filters.companySize === "> $1B Enterprise"
      ? 0.88
      : filters.companySize === "< $250M Revenue"
        ? 1.12
        : 1.0;

  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  const rawSpecs: Array<Omit<KpiBenchmarkDetail, "gapVsPeer" | "gapVsBestInClass" | "formattedGapVsPeer" | "classification">> = [
    {
      id: "invoices_per_fte",
      name: "Invoices Processed per AP FTE",
      shortName: "Invoices / FTE",
      unit: "inv / FTE / yr",
      betterDirection: "higher",
      clientValue: m.invoicesPerFte,
      formattedClient: `${m.invoicesPerFte.toLocaleString()} / yr`,
      industryBenchmark: Math.round(32000 * regionThroughputMult),
      peerBenchmark: Math.round(36000 * regionThroughputMult),
      bestInClassBenchmark: Math.round(44000 * regionThroughputMult),
      formula: "Annual Invoice Volume (144,000) ÷ Total AP FTEs (9.0)",
      dataSource: "AP Invoice Register (DS-01) & Workforce RACI (DS-06) [Illustrative Demo Baseline]",
      businessInterpretation:
        "At 16,000 invoices/FTE, Harlow sits 56% below the peer median (36,000). This is a process and upstream PO compliance problem—not a staff capability problem—driven by 38% non-PO volume and 18% exception rework.",
      improvementOpportunity:
        "Combine No-PO-No-Pay governance (OPP-04) with AI/IDP line extraction (OPP-02) to release ~3.5 FTEs of manual keying and exception-chasing capacity.",
      potentialFinancialImpactUsd: 238000,
      linkedDatasetIds: ["ds_invoice_extract", "ds_sop_doc"],
      linkedRootCauseIds: ["rc_01", "rc_02"],
      linkedOpportunityIds: ["opp_02", "opp_04", "opp_05"],
      linkedStageIds: ["stage_05", "stage_06", "stage_08"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Math.round(m.invoicesPerFte * (0.95 + i * 0.01)),
        peer: Math.round(36000 * regionThroughputMult),
        bestInClass: Math.round(44000 * regionThroughputMult),
      })),
    },
    {
      id: "cost_per_invoice",
      name: "Average Cost per Invoice",
      shortName: "Cost / Invoice",
      unit: "$ / invoice",
      betterDirection: "lower",
      clientValue: m.costPerInvoice,
      formattedClient: `$${m.costPerInvoice.toFixed(2)}`,
      industryBenchmark: Number((6.4 * sizeCostMult).toFixed(2)),
      peerBenchmark: Number((5.2 * sizeCostMult).toFixed(2)),
      bestInClassBenchmark: Number((2.4 * sizeCostMult).toFixed(2)),
      formula: "(Loaded AP Labor Cost + AP Tech/Overhead + Exception Rework Cost) ÷ Annual Invoice Volume",
      dataSource: "Value Realization Cost Model & DS-01 [Illustrative Demo Baseline]",
      businessInterpretation:
        "Each invoice costs $11.80 to process—more than double the $5.20 peer benchmark. Manual exception resolution ($14.50 per blocked invoice) and manual line validation are the primary cost drivers.",
      improvementOpportunity:
        "Increase touchless processing from 34% to 78% and cut exceptions from 18% to 6% to reduce unit cost toward $4.60/invoice.",
      potentialFinancialImpactUsd: 215000,
      linkedDatasetIds: ["ds_invoice_extract", "ds_aging_extract"],
      linkedRootCauseIds: ["rc_01", "rc_02"],
      linkedOpportunityIds: ["opp_01", "opp_02", "opp_04", "opp_05"],
      linkedStageIds: ["stage_05", "stage_06", "stage_08"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Number((m.costPerInvoice + (2 - i * 0.4) * 0.2).toFixed(2)),
        peer: Number((5.2 * sizeCostMult).toFixed(2)),
        bestInClass: Number((2.4 * sizeCostMult).toFixed(2)),
      })),
    },
    {
      id: "cycle_time_days",
      name: "Invoice Processing Cycle Time",
      shortName: "Cycle Time",
      unit: "days",
      betterDirection: "lower",
      clientValue: m.cycleTimeDays,
      formattedClient: `${m.cycleTimeDays.toFixed(1)} days`,
      industryBenchmark: 4.5,
      peerBenchmark: 3.8,
      bestInClassBenchmark: 1.8,
      formula: "Mean calendar days from Invoice Receipt Timestamp to Posted Voucher in ERP",
      dataSource: "Invoice Aging & Exception Extract (DS-02) [Illustrative Demo Baseline]",
      businessInterpretation:
        "While clean PO-backed invoices post in 2.4 days, non-PO and blocked invoices average 9.8 days due to sequential Cost Center Head + Controller sign-off without escalation, pulling the overall average to 6.0 days.",
      improvementOpportunity:
        "Enable 48-hour approval escalation, substitute approver delegation, and IDP straight-through posting (OPP-06).",
      potentialFinancialImpactUsd: 156000,
      linkedDatasetIds: ["ds_aging_extract", "ds_sop_doc"],
      linkedRootCauseIds: ["rc_01", "rc_03"],
      linkedOpportunityIds: ["opp_01", "opp_05", "opp_06"],
      linkedStageIds: ["stage_05", "stage_08", "stage_09"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Number((m.cycleTimeDays + (i % 2 === 0 ? 0.3 : -0.2)).toFixed(1)),
        peer: 3.8,
        bestInClass: 1.8,
      })),
    },
    {
      id: "touchless_rate",
      name: "Touchless Processing Rate",
      shortName: "Touchless Rate",
      unit: "%",
      betterDirection: "higher",
      clientValue: m.touchlessRate,
      formattedClient: `${m.touchlessRate}%`,
      industryBenchmark: 58,
      peerBenchmark: 65,
      bestInClassBenchmark: 88,
      formula: "(Invoices Posted With Zero Human Intervention ÷ Total Invoices Processed) × 100",
      dataSource: "AP Invoice Register Extract (DS-01) [Illustrative Demo Baseline]",
      businessInterpretation:
        "Only 34% of invoices post straight through without human touch. Legacy OCR requires manual line verification, and 38% non-PO volume cannot be auto-matched.",
      improvementOpportunity:
        "Deploy AI/IDP line extraction (OPP-02) + 3-way match tolerance tuning & PO governance (OPP-04) to reach 78% touchless.",
      potentialFinancialImpactUsd: 195000,
      linkedDatasetIds: ["ds_invoice_extract"],
      linkedRootCauseIds: ["rc_01", "rc_02"],
      linkedOpportunityIds: ["opp_01", "opp_02", "opp_03", "opp_04"],
      linkedStageIds: ["stage_05", "stage_06", "stage_07"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Math.max(10, m.touchlessRate - 3 + i),
        peer: 65,
        bestInClass: 88,
      })),
    },
    {
      id: "po_backed_rate",
      name: "PO-Backed Invoices",
      shortName: "PO-Backed %",
      unit: "%",
      betterDirection: "higher",
      clientValue: m.poBackedRate,
      formattedClient: `${m.poBackedRate}%`,
      industryBenchmark: Math.min(96, 80 + industryPoAdd),
      peerBenchmark: Math.min(96, 85 + industryPoAdd),
      bestInClassBenchmark: 95,
      formula: "(Invoices Linked to an Approved Purchase Order ÷ Total Invoices) × 100",
      dataSource: "AP Invoice Register (DS-01) & PO Extract (DS-04) [Illustrative Demo Baseline]",
      businessInterpretation:
        "At 62% PO coverage, 54,720 invoices per year bypass automated 3-way matching entirely. This is the primary upstream root cause of AP exceptions and approval delays.",
      improvementOpportunity:
        "Enforce joint Procurement–Finance No-PO-No-Pay policy with defined exception categories and blanket PO catalogs (OPP-04).",
      potentialFinancialImpactUsd: 210000,
      linkedDatasetIds: ["ds_invoice_extract", "ds_po_extract"],
      linkedRootCauseIds: ["rc_01"],
      linkedOpportunityIds: ["opp_04"],
      linkedStageIds: ["stage_02", "stage_03", "stage_07"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Math.max(20, m.poBackedRate - 2 + (i % 3)),
        peer: Math.min(96, 85 + industryPoAdd),
        bestInClass: 95,
      })),
    },
    {
      id: "exception_rate",
      name: "Invoice Exception Rate",
      shortName: "Exception Rate",
      unit: "%",
      betterDirection: "lower",
      clientValue: m.exceptionRate,
      formattedClient: `${m.exceptionRate}%`,
      industryBenchmark: 10,
      peerBenchmark: 8,
      bestInClassBenchmark: 2,
      formula: "(Invoices Blocked for Price, Quantity, GRN, or Coding Exception ÷ Total Invoices) × 100",
      dataSource: "Invoice Aging & Exception Extract (DS-02) [Illustrative Demo Baseline]",
      businessInterpretation:
        "18% of all invoices (25,920/yr) hit a manual exception—more than 2x the 8% peer benchmark. 44% stem from late warehouse GRN entry, 31% from non-PO holds, and 25% from tight $25 freight tolerances.",
      improvementOpportunity:
        "Recalibrate freight match tolerances to 2%/$100 (OPP-04), enforce 24-hr dock GRN entry, and automate exception triage (OPP-05).",
      potentialFinancialImpactUsd: 250000,
      linkedDatasetIds: ["ds_aging_extract", "ds_gl_grir"],
      linkedRootCauseIds: ["rc_01", "rc_02"],
      linkedOpportunityIds: ["opp_04", "opp_05", "opp_06"],
      linkedStageIds: ["stage_04", "stage_07", "stage_08"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Number((m.exceptionRate + (i % 2 === 0 ? 0.8 : -0.5)).toFixed(1)),
        peer: 8,
        bestInClass: 2,
      })),
    },
    {
      id: "on_time_payment_rate",
      name: "On-Time Payment Rate",
      shortName: "On-Time Payment",
      unit: "%",
      betterDirection: "higher",
      clientValue: m.onTimePaymentRate,
      formattedClient: `${m.onTimePaymentRate}%`,
      industryBenchmark: 84,
      peerBenchmark: 88,
      bestInClassBenchmark: 96,
      formula: "(Invoices Settled on or Before Agreed Net Due Date ÷ Total Paid Invoices) × 100",
      dataSource: "Invoice Aging & Exception Extract (DS-02) [Illustrative Demo Baseline]",
      businessInterpretation:
        "Overall on-time payment is 81% (7 pts behind the 88% peer benchmark), but masks a sharp bifurcation: PO-backed invoices pay 92% on time, whereas non-PO invoices pay only 63% on time due to approval bottlenecks.",
      improvementOpportunity:
        "Eliminate non-PO approval dwell time via 48-hour escalation (OPP-06) and rationalize the 47 payment terms (OPP-10).",
      potentialFinancialImpactUsd: 95000,
      linkedDatasetIds: ["ds_aging_extract", "ds_vendor_master"],
      linkedRootCauseIds: ["rc_03", "rc_05"],
      linkedOpportunityIds: ["opp_06", "opp_10", "opp_12"],
      linkedStageIds: ["stage_09", "stage_10"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Math.min(99, m.onTimePaymentRate - 1 + (i % 3)),
        peer: 88,
        bestInClass: 96,
      })),
    },
    {
      id: "discount_capture_rate",
      name: "Early-Payment Discount Capture",
      shortName: "Discount Capture",
      unit: "%",
      betterDirection: "higher",
      clientValue: m.discountCaptureRate,
      formattedClient: `${m.discountCaptureRate}%`,
      industryBenchmark: 55,
      peerBenchmark: 68,
      bestInClassBenchmark: 88,
      formula: "(Early Payment Discounts Captured ($) ÷ Total Eligible Discount Pool ($280k)) × 100",
      dataSource: "PO & Discount Terms Extract (DS-04) [Illustrative Demo Baseline]",
      businessInterpretation:
        "Harlow captures only 38% of eligible early-payment discounts ($106.4k captured vs. $173.6k lost annually). Discounts are lost because the 6.0-day average cycle time misses 10-day discount windows.",
      improvementOpportunity:
        "Flag 2/10 Net 30 invoices at intake for 24-hour fast-track approval and dynamic F110 prioritization (OPP-10).",
      potentialFinancialImpactUsd: 131600,
      linkedDatasetIds: ["ds_po_extract", "ds_aging_extract"],
      linkedRootCauseIds: ["rc_03"],
      linkedOpportunityIds: ["opp_06", "opp_10"],
      linkedStageIds: ["stage_09", "stage_10"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: Math.max(15, m.discountCaptureRate - 2 + i),
        peer: 68,
        bestInClass: 88,
      })),
    },
    {
      id: "vendor_query_rate",
      name: "Vendor Query Rate (per 1,000 Invoices)",
      shortName: "Vendor Queries",
      unit: "per 1k inv",
      betterDirection: "lower",
      clientValue: m.vendorQueryRatePer1k,
      formattedClient: `${m.vendorQueryRatePer1k} / 1k (${m.monthlyQueries.toLocaleString()}/mo)`,
      industryBenchmark: 42,
      peerBenchmark: 35,
      bestInClassBenchmark: 12,
      formula: "(Monthly Vendor Inquiries (900) ÷ Monthly Invoice Volume (12,000)) × 1,000",
      dataSource: "Invoice Aging Extract (DS-02) & AP Workforce Log [Illustrative Demo Baseline]",
      businessInterpretation:
        "75 queries per 1,000 invoices (10,800 inquiries/year) is more than double the peer benchmark (35), consuming 1.5 FTEs who manually check SAP FBL1N to answer 'where is my payment?'",
      improvementOpportunity:
        "Fix upstream non-PO payment timeliness first, then deploy automated remittance push and Supplier Status Portal (OPP-07).",
      potentialFinancialImpactUsd: 72000,
      linkedDatasetIds: ["ds_aging_extract", "ds_vendor_master"],
      linkedRootCauseIds: ["rc_05"],
      linkedOpportunityIds: ["opp_07", "opp_11"],
      linkedStageIds: ["stage_08", "stage_10"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: m.vendorQueryRatePer1k + (i % 2 === 0 ? 3 : -2),
        peer: 35,
        bestInClass: 12,
      })),
    },
    {
      id: "automation_maturity",
      name: "AP Automation & Control Maturity",
      shortName: "AP Maturity",
      unit: "score / 5.0",
      betterDirection: "higher",
      clientValue: m.avgMaturity,
      formattedClient: `${m.avgMaturity.toFixed(1)} / 5.0`,
      industryBenchmark: 3.2,
      peerBenchmark: 3.6,
      bestInClassBenchmark: 4.5,
      formula: "Mean Maturity Score across 12 End-to-End AP Process Stages (Scale 1.0 Ad hoc to 5.0 Intelligent)",
      dataSource: "12-Stage Process Assessment Matrix [Illustrative Demo Baseline]",
      businessInterpretation:
        "Overall AP maturity sits at 2.3 / 5.0 (Developing), pulled down by Level 1 Supplier Onboarding controls (unsegregated vendor master access) and Level 2 manual exception/approval workflows.",
      improvementOpportunity:
        "Execute the 3-Wave Roadmap to lift process maturity to 4.1 / 5.0 (Optimized) within 9 months.",
      potentialFinancialImpactUsd: 160000,
      linkedDatasetIds: ["ds_vendor_master", "ds_sop_doc", "ds_gl_grir"],
      linkedRootCauseIds: ["rc_02", "rc_04"],
      linkedOpportunityIds: ["opp_02", "opp_08", "opp_09", "opp_12"],
      linkedStageIds: ["stage_01", "stage_06", "stage_08", "stage_12"],
      monthlyTrend: months.map((mo) => ({
        month: mo,
        client: m.avgMaturity,
        peer: 3.6,
        bestInClass: 4.5,
      })),
    },
    {
      id: "dpo_days",
      name: "Days Payable Outstanding (DPO)",
      shortName: "DPO",
      unit: "days",
      betterDirection: "higher",
      clientValue: m.dpoDays,
      formattedClient: `${m.dpoDays} days`,
      industryBenchmark: 52,
      peerBenchmark: 55,
      bestInClassBenchmark: 62,
      formula: "(Average Accounts Payable Balance ÷ Total Annual Cost of Spend) × 365",
      dataSource: "Invoice Aging Extract (DS-02) & Vendor Master (DS-03) [Illustrative Demo Baseline]",
      businessInterpretation:
        "Harlow's 58-day DPO sits near the 55-day peer point, but is distorted by 47 unstandardized payment term codes and 37% late payments on non-PO invoices rather than deliberate working capital optimization.",
      improvementOpportunity:
        "Rationalize 47 payment terms into 6 standard commercial bands (Net 45 / Net 60) while lifting on-time payment to 94% (OPP-10, OPP-12).",
      potentialFinancialImpactUsd: 52500,
      linkedDatasetIds: ["ds_aging_extract", "ds_vendor_master"],
      linkedRootCauseIds: ["rc_05"],
      linkedOpportunityIds: ["opp_10", "opp_12"],
      linkedStageIds: ["stage_10", "stage_12"],
      monthlyTrend: months.map((mo, i) => ({
        month: mo,
        client: m.dpoDays + (i % 2 === 0 ? 1 : -1),
        peer: 55,
        bestInClass: 62,
      })),
    },
  ];

  return rawSpecs.map((item) => {
    const rawGapPeer =
      item.betterDirection === "higher"
        ? Number((item.clientValue - item.peerBenchmark).toFixed(2))
        : Number((item.peerBenchmark - item.clientValue).toFixed(2));

    const gapVsBestInClass =
      item.betterDirection === "higher"
        ? Number((item.clientValue - item.bestInClassBenchmark).toFixed(2))
        : Number((item.bestInClassBenchmark - item.clientValue).toFixed(2));

    const pctDiffFromPeer =
      item.peerBenchmark !== 0
        ? (rawGapPeer / item.peerBenchmark) * 100
        : 0;

    let classification: KpiBenchmarkDetail["classification"];
    if (pctDiffFromPeer >= 2) {
      classification = "Outperforming";
    } else if (pctDiffFromPeer >= -12) {
      classification = "Near Peer";
    } else if (pctDiffFromPeer >= -30) {
      classification = "Below Peer";
    } else {
      classification = "Critical Gap";
    }

    const diffDisplay = Math.abs(
      Number((item.clientValue - item.peerBenchmark).toFixed(1)),
    );
    const sign =
      item.clientValue >= item.peerBenchmark ? "+" : "-";
    const formattedGapVsPeer =
      item.unit === "$ / invoice"
        ? `${sign}$${diffDisplay.toFixed(2)} vs Peer`
        : item.unit === "%"
          ? `${sign}${diffDisplay} pts vs Peer`
          : `${sign}${diffDisplay.toLocaleString()} ${item.unit} vs Peer`;

    return {
      ...item,
      gapVsPeer: rawGapPeer,
      gapVsBestInClass,
      formattedGapVsPeer,
      classification,
    };
  });
}

export interface BenefitCategoryBreakdown {
  id: string;
  name: string;
  benefitType:
    | "Hard Savings"
    | "Cost Avoidance"
    | "Capacity Released"
    | "Revenue / Discount Benefit"
    | "Working Capital Impact";
  annualValueUsd: number;
  formulaText: string;
  calculationDetail: string;
  fteEquivalent?: number;
}

export interface ValueRealizationSummary {
  scenario: ValueScenario;
  scenarioMultiplier: number;
  categories: BenefitCategoryBreakdown[];
  hardSavingsAnnualUsd: number;
  discountBenefitsAnnualUsd: number;
  costAvoidanceAnnualUsd: number;
  capacityReleasedAnnualUsd: number;
  workingCapitalFinancingAnnualUsd: number;
  oneTimeWorkingCapitalReleaseUsd: number;
  grossAnnualBenefitUsd: number;
  recurringTechCostAnnualUsd: number;
  netAnnualBenefitUsd: number;
  implementationCostUsd: number;
  paybackMonths: number;
  threeYearGrossUsd: number;
  threeYearNetBenefitUsd: number;
  roiPct: number;
  releasedFtes: number;
  scenarioComparison: Array<{
    scenario: ValueScenario;
    grossAnnualUsd: number;
    netAnnualUsd: number;
    threeYearNetUsd: number;
    paybackMonths: number;
    roiPct: number;
  }>;
  threeYearTimeline: Array<{
    year: string;
    grossBenefit: number;
    investmentAndRecurring: number;
    netCashFlow: number;
    cumulativeNet: number;
  }>;
}

/**
 * Deterministic Value Realization Engine with zero double-counting:
 * - Category 1 (Labor Productivity / Capacity Released): Based strictly on manual indexing/posting hours saved via touchless automation improvement.
 * - Category 2 (Processing Cost Reduction — Hard Savings): Based strictly on non-labor unit processing overhead (scanner/mailroom/archive/BPO/print fees, ~22% of unit cost reduction) so labor is NEVER counted twice.
 * - Category 3 (Exception Reduction — Hard Savings / Rework Reduction): Direct cost of resolving blocked invoices eliminated.
 * - Category 4 (Early-Payment Discount Capture — Cash/Discount Benefit): Eligible discount pool × increase in capture rate.
 * - Category 5 (Duplicate Payment Prevention — Cost Avoidance): Annual spend × duplicate exposure rate × prevention rate.
 * - Category 6 (Late Payment Avoidance — Cost Avoidance): Statutory MSME interest & late-fee penalties avoided.
 * - Category 7 (Working Capital Optimization — Working Capital Impact): Annual financing value of DPO improvement (plus one-time cash release disclosed separately).
 * - Category 8 (Supplier Query Reduction — Capacity Released): Annual queries deflected × handling cost per query.
 */
export function computeValueRealization(
  assumptions: ValueAssumptions,
  scenario: ValueScenario = "Base Case",
): ValueRealizationSummary {
  const mult =
    scenario === "Conservative" ? 0.75 : scenario === "Optimistic" ? 1.22 : 1.0;

  const calcForMultiplier = (m: number) => {
    const hourlyLaborCost = assumptions.avgAnnualEmployeeCostUsd / 2080;
    const automationImprovementFrac = Math.max(
      0,
      (assumptions.targetAutomationRatePct - assumptions.currentAutomationRatePct) / 100,
    );
    const hoursPerInvoice = assumptions.manualHandlingMinutesPerInvoice / 60;

    // 1. Labor Productivity (Capacity Released)
    const hoursReleased =
      assumptions.annualInvoiceVolume *
      automationImprovementFrac *
      hoursPerInvoice *
      m;
    const releasedFtes = Number((hoursReleased / 2080).toFixed(2));
    const laborProductivityUsd = Math.round(hoursReleased * hourlyLaborCost);

    // 2. Processing Cost Reduction (Non-Labor Hard Savings only: mailroom, paper, check printing, EDI/archive overhead = $0.85/automated invoice)
    const nonLaborUnitSavingUsd = Math.max(0.45, assumptions.costPerInvoiceUsd * 0.08);
    const processingCostReductionUsd = Math.round(
      assumptions.annualInvoiceVolume *
        automationImprovementFrac *
        nonLaborUnitSavingUsd *
        m,
    );

    // 3. Exception Reduction
    const exceptionReductionFrac = Math.max(
      0,
      (assumptions.exceptionRatePct - assumptions.targetExceptionRatePct) / 100,
    );
    const exceptionsEliminated = Math.round(
      assumptions.annualInvoiceVolume * exceptionReductionFrac * m,
    );
    const exceptionReductionUsd = Math.round(
      exceptionsEliminated * assumptions.avgExceptionHandlingCostUsd,
    );

    // 4. Early-Payment Discount Capture
    const totalEligibleDiscountPoolUsd =
      assumptions.eligibleDiscountSpendUsd * (assumptions.avgDiscountRatePct / 100);
    const discountCaptureGainFrac = Math.max(
      0,
      (assumptions.targetDiscountCaptureRatePct - assumptions.discountCaptureRatePct) /
        100,
    );
    const discountCaptureUsd = Math.round(
      totalEligibleDiscountPoolUsd * discountCaptureGainFrac * m,
    );

    // 5. Duplicate Payment Prevention
    const duplicateExposureUsd =
      assumptions.annualSpendUsd * (assumptions.duplicatePaymentRatePct / 100);
    const duplicatePreventionUsd = Math.round(
      duplicateExposureUsd *
        (assumptions.duplicateRecoveryPreventionPct / 100) *
        m,
    );

    // 6. Late Payment & Statutory MSME Penalty Avoidance
    const latePaymentAvoidanceUsd = Math.round(
      assumptions.latePaymentPenaltiesAnnualUsd *
        (assumptions.latePaymentReductionPct / 100) *
        m,
    );

    // 7. Working Capital Optimization (Annual Cost-of-Capital Benefit on DPO Extension)
    const oneTimeWorkingCapitalReleaseUsd = Math.round(
      (assumptions.annualSpendUsd / 365) * assumptions.dpoImprovementDays * m,
    );
    const workingCapitalAnnualBenefitUsd = Math.round(
      oneTimeWorkingCapitalReleaseUsd * (assumptions.costOfCapitalPct / 100),
    );

    // 8. Supplier Query Reduction
    const annualQueries = assumptions.monthlyVendorQueries * 12;
    const queriesEliminated = Math.round(
      annualQueries * (assumptions.queryReductionPct / 100) * m,
    );
    const queryReductionUsd = Math.round(
      queriesEliminated * assumptions.costPerQueryUsd,
    );

    const categories: BenefitCategoryBreakdown[] = [
      {
        id: "ben_labor",
        name: "1. Labor Productivity (Touchless Indexing)",
        benefitType: "Capacity Released",
        annualValueUsd: laborProductivityUsd,
        formulaText:
          "Annual Invoices × Automation Gain % × Manual Hours/Inv × Loaded Hourly Rate",
        calculationDetail: `${assumptions.annualInvoiceVolume.toLocaleString()} inv × ${(
          automationImprovementFrac *
          100 *
          m
        ).toFixed(1)}% × ${assumptions.manualHandlingMinutesPerInvoice} mins × $${hourlyLaborCost.toFixed(
          2,
        )}/hr (${releasedFtes} FTE capacity)`,
        fteEquivalent: releasedFtes,
      },
      {
        id: "ben_proc",
        name: "2. Non-Labor Processing & Check Overhead Reduction",
        benefitType: "Hard Savings",
        annualValueUsd: processingCostReductionUsd,
        formulaText:
          "Annual Invoices × Automation Gain % × Non-Labor Unit Overhead Saving (Excludes Labor)",
        calculationDetail: `${assumptions.annualInvoiceVolume.toLocaleString()} inv × ${(
          automationImprovementFrac *
          100 *
          m
        ).toFixed(1)}% × $${nonLaborUnitSavingUsd.toFixed(2)} non-labor overhead/inv`,
      },
      {
        id: "ben_exc",
        name: "3. Exception Handling & Rework Reduction",
        benefitType: "Hard Savings",
        annualValueUsd: exceptionReductionUsd,
        formulaText:
          "Annual Invoices × Exception Rate Reduction % × Cost per Exception Resolution",
        calculationDetail: `${exceptionsEliminated.toLocaleString()} fewer exceptions/yr × $${assumptions.avgExceptionHandlingCostUsd.toFixed(
          2,
        )} per exception`,
      },
      {
        id: "ben_disc",
        name: "4. Early-Payment Discount Capture",
        benefitType: "Revenue / Discount Benefit",
        annualValueUsd: discountCaptureUsd,
        formulaText:
          "Eligible Discount Spend × Avg Discount % × Capture Rate Improvement %",
        calculationDetail: `$${(
          assumptions.eligibleDiscountSpendUsd / 1_000_000
        ).toFixed(1)}M × ${assumptions.avgDiscountRatePct}% ($${(
          totalEligibleDiscountPoolUsd / 1000
        ).toFixed(0)}k pool) × +${(discountCaptureGainFrac * 100 * m).toFixed(1)}% gain`,
      },
      {
        id: "ben_dup",
        name: "5. Duplicate Payment Prevention",
        benefitType: "Cost Avoidance",
        annualValueUsd: duplicatePreventionUsd,
        formulaText:
          "Annual Spend × Duplicate Exposure % × Pre-Payment AI Prevention Rate %",
        calculationDetail: `$${(assumptions.annualSpendUsd / 1_000_000).toFixed(
          1,
        )}M spend × ${assumptions.duplicatePaymentRatePct}% × ${Math.round(
          assumptions.duplicateRecoveryPreventionPct * m,
        )}% prevented`,
      },
      {
        id: "ben_late",
        name: "6. Late Payment & MSME Interest Avoidance",
        benefitType: "Cost Avoidance",
        annualValueUsd: latePaymentAvoidanceUsd,
        formulaText: "Annual Late Payment Penalties & MSME Interest × Reduction %",
        calculationDetail: `$${assumptions.latePaymentPenaltiesAnnualUsd.toLocaleString()} baseline exposure × ${Math.round(
          assumptions.latePaymentReductionPct * m,
        )}% reduction`,
      },
      {
        id: "ben_wc",
        name: "7. Working Capital Financing Optimization",
        benefitType: "Working Capital Impact",
        annualValueUsd: workingCapitalAnnualBenefitUsd,
        formulaText:
          "((Annual Spend ÷ 365) × DPO Extension Days) × Cost of Capital %",
        calculationDetail: `$${(
          oneTimeWorkingCapitalReleaseUsd / 1000
        ).toFixed(0)}k balance-sheet cash release × ${assumptions.costOfCapitalPct}% WACC`,
      },
      {
        id: "ben_query",
        name: "8. Supplier Query Deflection",
        benefitType: "Capacity Released",
        annualValueUsd: queryReductionUsd,
        formulaText: "Annual Vendor Queries × Deflection % × Handling Cost per Query",
        calculationDetail: `${queriesEliminated.toLocaleString()} queries deflected/yr × $${assumptions.costPerQueryUsd.toFixed(
          2,
        )}/query`,
      },
    ];

    const hardSavingsAnnualUsd =
      processingCostReductionUsd + exceptionReductionUsd;
    const discountBenefitsAnnualUsd = discountCaptureUsd;
    const costAvoidanceAnnualUsd =
      duplicatePreventionUsd + latePaymentAvoidanceUsd;
    const capacityReleasedAnnualUsd = laborProductivityUsd + queryReductionUsd;
    const workingCapitalFinancingAnnualUsd = workingCapitalAnnualBenefitUsd;

    const grossAnnualBenefitUsd =
      hardSavingsAnnualUsd +
      discountBenefitsAnnualUsd +
      costAvoidanceAnnualUsd +
      capacityReleasedAnnualUsd +
      workingCapitalFinancingAnnualUsd;

    const netAnnualBenefitUsd = Math.max(
      0,
      grossAnnualBenefitUsd - assumptions.recurringTechCostAnnualUsd,
    );

    const monthlyNetBenefit = netAnnualBenefitUsd / 12;
    const paybackMonths =
      monthlyNetBenefit > 0
        ? Number((assumptions.implementationCostUsd / monthlyNetBenefit).toFixed(1))
        : 0;

    // 3-Year ramp: Year 1 = 65% realization, Year 2 = 100%, Year 3 = 108%
    const y1Gross = Math.round(grossAnnualBenefitUsd * 0.65);
    const y2Gross = grossAnnualBenefitUsd;
    const y3Gross = Math.round(grossAnnualBenefitUsd * 1.08);
    const threeYearGrossUsd = y1Gross + y2Gross + y3Gross;

    const y1Costs =
      assumptions.implementationCostUsd + assumptions.recurringTechCostAnnualUsd;
    const y2Costs = assumptions.recurringTechCostAnnualUsd;
    const y3Costs = assumptions.recurringTechCostAnnualUsd;
    const totalThreeYearCost = y1Costs + y2Costs + y3Costs;

    const threeYearNetBenefitUsd = threeYearGrossUsd - totalThreeYearCost;
    const roiPct =
      totalThreeYearCost > 0
        ? Math.round((threeYearNetBenefitUsd / totalThreeYearCost) * 100)
        : 0;

    const y1Net = y1Gross - y1Costs;
    const y2Net = y2Gross - y2Costs;
    const y3Net = y3Gross - y3Costs;

    const threeYearTimeline = [
      {
        year: "Year 1 (Ramp & Build)",
        grossBenefit: y1Gross,
        investmentAndRecurring: y1Costs,
        netCashFlow: y1Net,
        cumulativeNet: y1Net,
      },
      {
        year: "Year 2 (Full Run-Rate)",
        grossBenefit: y2Gross,
        investmentAndRecurring: y2Costs,
        netCashFlow: y2Net,
        cumulativeNet: y1Net + y2Net,
      },
      {
        year: "Year 3 (Continuous AI)",
        grossBenefit: y3Gross,
        investmentAndRecurring: y3Costs,
        netCashFlow: y3Net,
        cumulativeNet: y1Net + y2Net + y3Net,
      },
    ];

    return {
      categories,
      hardSavingsAnnualUsd,
      discountBenefitsAnnualUsd,
      costAvoidanceAnnualUsd,
      capacityReleasedAnnualUsd,
      workingCapitalFinancingAnnualUsd,
      oneTimeWorkingCapitalReleaseUsd,
      grossAnnualBenefitUsd,
      netAnnualBenefitUsd,
      paybackMonths,
      threeYearGrossUsd,
      threeYearNetBenefitUsd,
      roiPct,
      releasedFtes,
      threeYearTimeline,
    };
  };

  const current = calcForMultiplier(mult);
  const scenarios: ValueScenario[] = ["Conservative", "Base Case", "Optimistic"];
  const scenarioComparison = scenarios.map((sc) => {
    const scMult =
      sc === "Conservative" ? 0.75 : sc === "Optimistic" ? 1.22 : 1.0;
    const res = calcForMultiplier(scMult);
    return {
      scenario: sc,
      grossAnnualUsd: res.grossAnnualBenefitUsd,
      netAnnualUsd: res.netAnnualBenefitUsd,
      threeYearNetUsd: res.threeYearNetBenefitUsd,
      paybackMonths: res.paybackMonths,
      roiPct: res.roiPct,
    };
  });

  return {
    scenario,
    scenarioMultiplier: mult,
    ...current,
    recurringTechCostAnnualUsd: assumptions.recurringTechCostAnnualUsd,
    implementationCostUsd: assumptions.implementationCostUsd,
    scenarioComparison,
  };
}
