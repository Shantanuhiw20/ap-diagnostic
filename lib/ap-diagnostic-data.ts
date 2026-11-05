import { parseCsvLine } from "./csv";

export const FIXED_INTERVIEW_FIELD_IDS = [
  "ap_03",
  "ap_04",
  "ap_08",
  "ap_09",
  "ap_11",
  "ap_10",
  "ap_14",
  "ap_17",
  "ap_19",
] as const;

export type PriorityTier = 1 | 2 | 3 | 4;
export type FieldStatus = "ANSWERED" | "PARTIAL" | "MISSING";

export interface ChecklistFieldSpec {
  field_id: string;
  category:
    | "Vendor Master"
    | "Invoice Processing"
    | "Payments"
    | "Reconciliation"
    | "Query & Dispute"
    | "Compliance"
    | "Team"
    | "Pain point";
  question: string;
  shortLabel: string;
  why_it_matters: string;
  data_type: "number" | "percentage" | "text" | "yes/no" | "number (days)";
  unit?: string;
  tier: PriorityTier;
  tierLabel: string;
  isFixedInterview: boolean;
  skillOwner: string;
  placeholder: string;
}

export const AP_CHECKLIST_FIELDS: ChecklistFieldSpec[] = [
  {
    field_id: "ap_01",
    category: "Vendor Master",
    shortLabel: "Active Vendor Count",
    question: "How many active vendors do you have in the ERP today?",
    why_it_matters:
      "Master data volume drives duplicate payment risk, and a long tail of one-time vendors is a standing finding",
    data_type: "number",
    unit: "vendors",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/vendor-master-review",
    placeholder: "e.g. 2,400 active vendors",
  },
  {
    field_id: "ap_02",
    category: "Vendor Master",
    shortLabel: "Vendor Master Access",
    question: "Who can create or amend a vendor master record today?",
    why_it_matters:
      "Vendor creation without segregation of duties is the single most common fraud exposure in AP",
    data_type: "text",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: false,
    skillOwner: "/vendor-master-review",
    placeholder: "e.g. AP processing team or dedicated master data team",
  },
  {
    field_id: "ap_21",
    category: "Vendor Master",
    shortLabel: "Vendor Master Approval Check",
    question:
      "What check or approval sits in front of a vendor master creation or amendment, if any?",
    why_it_matters:
      "Whether a check exists at all is the fact that decides if this is a control or just a habit",
    data_type: "text",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: false,
    skillOwner: "/vendor-master-review",
    placeholder: "e.g. Dual approval in ERP or no independent review",
  },
  {
    field_id: "ap_22",
    category: "Vendor Master",
    shortLabel: "Bank-Detail Change Verification",
    question:
      "When a vendor requests a change to their bank details, what verification happens before the record is updated (for example, a callback to a number already on file)?",
    why_it_matters:
      "Bank-detail change with no independent verification is the highest-consequence weakness in vendor master, and it's usually held together by habit rather than a documented control",
    data_type: "text",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: false,
    skillOwner: "/vendor-master-review",
    placeholder: "e.g. Callback to on-file contact + dual approval",
  },
  {
    field_id: "ap_03",
    category: "Invoice Processing",
    shortLabel: "Monthly Invoice Volume",
    question: "How many vendor invoices does the team process in a typical month?",
    why_it_matters:
      "Sets the scale of the operation and every per-FTE productivity comparison",
    data_type: "number",
    unit: "invoices/mo",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: true,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. 12,000",
  },
  {
    field_id: "ap_04",
    category: "Invoice Processing",
    shortLabel: "PO-Backed Invoices (%)",
    question: "What percentage of invoices are PO-backed versus non-PO?",
    why_it_matters:
      "Non-PO spend is the most cited AP lever, since it is manual, harder to control and slower to approve",
    data_type: "percentage",
    unit: "%",
    tier: 1,
    tierLabel: "Tier 1 · Blocking Root Cause",
    isFixedInterview: true,
    skillOwner: "/procurement-review",
    placeholder: "e.g. 62%",
  },
  {
    field_id: "ap_05",
    category: "Invoice Processing",
    shortLabel: "Invoice Intake Channels",
    question:
      "How do invoices reach you: post, email, EDI, a vendor portal, or a mix?",
    why_it_matters:
      "Channel mix determines whether capture can be automated at all, and paper is a hidden cost",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. 70% email PDF, 20% paper scan, 10% EDI",
  },
  {
    field_id: "ap_06",
    category: "Invoice Processing",
    shortLabel: "OCR / Automated Capture",
    question: "Do you use OCR or automated data capture for invoices today?",
    why_it_matters:
      "Shows current automation maturity and sizes the indexing effort",
    data_type: "yes/no",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. Yes (SAP OCR enabled for scans, email PDFs keyed manually)",
  },
  {
    field_id: "ap_07",
    category: "Invoice Processing",
    shortLabel: "3-Way Match & Tolerance",
    question:
      "Do you run a three-way match, and what tolerance is set before an invoice needs manual review?",
    why_it_matters:
      "Tolerance settings decide how much genuinely needs a human, and a tight tolerance manufactures exceptions",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/grn-review",
    placeholder: "e.g. 3-way match on PO invoices, zero tolerance on freight variance",
  },
  {
    field_id: "ap_08",
    category: "Invoice Processing",
    shortLabel: "Invoice Exception Rate (%)",
    question:
      "Roughly what percentage of invoices hit an exception and need manual resolution? A best estimate is fine if this isn't formally tracked.",
    why_it_matters:
      "Direct proxy for rework and hidden cost, and the strongest predictor of AP effort",
    data_type: "percentage",
    unit: "%",
    tier: 1,
    tierLabel: "Tier 1 · Blocking Root Cause",
    isFixedInterview: true,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. 18%",
  },
  {
    field_id: "ap_09",
    category: "Invoice Processing",
    shortLabel: "Receipt-to-Posting Cycle (Days)",
    question:
      "Roughly how many days does it typically take from when an invoice is received to when it's fully posted and ready for payment? An estimate, or the approval-time figure if that's what's tracked, is fine.",
    why_it_matters:
      "Cycle time, separate from payment terms, and the cleanest measure of raw process speed",
    data_type: "number (days)",
    unit: "days",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: true,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. 6 days",
  },
  {
    field_id: "ap_10",
    category: "Payments",
    shortLabel: "Days Payable Outstanding (DPO)",
    question: "What is your average Days Payable Outstanding?",
    why_it_matters:
      "Core AP health metric, though it is read against terms rather than judged on its own",
    data_type: "number (days)",
    unit: "days",
    tier: 3,
    tierLabel: "Tier 3 · Sizing & Business Case",
    isFixedInterview: true,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 58 days",
  },
  {
    field_id: "ap_11",
    category: "Payments",
    shortLabel: "Paid on Time vs Terms (%)",
    question:
      "What percentage of invoices are paid on time against agreed terms?",
    why_it_matters:
      "Paid-on-time percentage is the headline AP service metric, and low figures signal an approval bottleneck",
    data_type: "percentage",
    unit: "%",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: true,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 41%",
  },
  {
    field_id: "ap_12",
    category: "Payments",
    shortLabel: "Electronic Payments (%)",
    question:
      "What percentage of payments go out electronically versus by cheque?",
    why_it_matters:
      "Cheque volume carries cost, delay and fraud exposure, and is usually an easy win",
    data_type: "percentage",
    unit: "%",
    tier: 3,
    tierLabel: "Tier 3 · Sizing & Business Case",
    isFixedInterview: false,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 55%",
  },
  {
    field_id: "ap_13",
    category: "Payments",
    shortLabel: "Distinct Payment Terms",
    question:
      "Roughly how many different payment terms are in use across your vendor base?",
    why_it_matters:
      "A long tail of unique terms makes on-time payment almost impossible to manage or measure",
    data_type: "number",
    unit: "count",
    tier: 3,
    tierLabel: "Tier 3 · Sizing & Business Case",
    isFixedInterview: false,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 47 terms",
  },
  {
    field_id: "ap_14",
    category: "Payments",
    shortLabel: "Early-Payment Discount Capture (%)",
    question:
      "Roughly what percentage of eligible early-payment discounts do you actually capture? A rough estimate is fine if this isn't tracked as a formal metric.",
    why_it_matters:
      "Missed discounts are a direct, quantifiable cost of a slow process",
    data_type: "percentage",
    unit: "%",
    tier: 3,
    tierLabel: "Tier 3 · Sizing & Business Case",
    isFixedInterview: true,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 38%",
  },
  {
    field_id: "ap_15",
    category: "Payments",
    shortLabel: "Payment Approval Steps",
    question:
      "How many approval steps does a payment go through, and do thresholds change who approves?",
    why_it_matters:
      "Identifies bottleneck roles, and whether delegation of authority is doing real work",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 2 steps above 50k INR (Cost Center Head + Finance Controller)",
  },
  {
    field_id: "ap_16",
    category: "Reconciliation",
    shortLabel: "GR-IR Clearance Backlog",
    question:
      "How large is your GR-IR clearance backlog, and how often is it reviewed?",
    why_it_matters:
      "An ageing GR-IR balance hides unmatched receipts and overstates or understates liabilities",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/grn-review",
    placeholder: "e.g. Reviewed monthly and cleared within the quarter",
  },
  {
    field_id: "ap_17",
    category: "Query & Dispute",
    shortLabel: "Monthly Vendor Queries",
    question: "Roughly how many vendor queries does the team handle in a month?",
    why_it_matters:
      "Sizes the query-handling sub-process, which is usually invisible in headcount planning",
    data_type: "number",
    unit: "queries/mo",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: true,
    skillOwner: "/vendor-master-review",
    placeholder: "e.g. 900 queries/month",
  },
  {
    field_id: "ap_18",
    category: "Compliance",
    shortLabel: "MSME & Interest Tracking",
    question:
      "How do you track MSME vendors and the interest exposure on late payment to them?",
    why_it_matters:
      "Statutory exposure with real financial consequences that is often tracked manually or not at all",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Context",
    isFixedInterview: false,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. Flagged in ERP, interest tracked manually in Excel",
  },
  {
    field_id: "ap_19",
    category: "Team",
    shortLabel: "AP FTE Headcount",
    question: "How many FTEs work in the AP function today?",
    why_it_matters:
      "Baseline for the capacity and automation conversation and for invoices-per-FTE benchmarking",
    data_type: "number",
    unit: "FTEs",
    tier: 2,
    tierLabel: "Tier 2 · Headline & Control",
    isFixedInterview: true,
    skillOwner: "/payment-run-review",
    placeholder: "e.g. 9 FTEs",
  },
  {
    field_id: "ap_20",
    category: "Pain point",
    shortLabel: "Primary AP Bottleneck",
    question:
      "What is the single biggest bottleneck in your AP process today, in your own words?",
    why_it_matters:
      "Open-ended and captures the tacit knowledge a form cannot",
    data_type: "text",
    tier: 4,
    tierLabel: "Tier 4 · Tacit Pain Point",
    isFixedInterview: false,
    skillOwner: "/invoice-processing-review",
    placeholder: "e.g. Non-PO invoices sitting in approver inboxes without escalation",
  },
];

export interface BenchmarkSpec {
  field_id: string;
  metric: string;
  unit: string;
  shortUnit: string;
  global_benchmark: number;
  india_benchmark: number;
  commonly_observed: string;
  betterDirection: "higher" | "lower" | "contextual";
  read: string;
  minRange: number;
  maxRange: number;
  step: number;
}

export const AP_BENCHMARKS: BenchmarkSpec[] = [
  {
    field_id: "ap_04",
    metric: "PO-backed invoices",
    unit: "percentage",
    shortUnit: "%",
    global_benchmark: 95,
    india_benchmark: 85,
    commonly_observed: "70-90",
    betterDirection: "higher",
    read: "Below 80% means most spend bypasses the control that makes matching possible, and everything downstream gets manual",
    minRange: 0,
    maxRange: 100,
    step: 1,
  },
  {
    field_id: "ap_08",
    metric: "Invoice exception rate",
    unit: "percentage",
    shortUnit: "%",
    global_benchmark: 2,
    india_benchmark: 8,
    commonly_observed: "10-20",
    betterDirection: "lower",
    read: "The strongest single predictor of AP effort. Above 15% the team is running a rework function, not a payment function",
    minRange: 0,
    maxRange: 50,
    step: 1,
  },
  {
    field_id: "ap_09",
    metric: "Invoice receipt to posting",
    unit: "days",
    shortUnit: "days",
    global_benchmark: 2,
    india_benchmark: 4,
    commonly_observed: "3-8",
    betterDirection: "lower",
    read: "Raw process speed, independent of payment terms. Anything above 5 days usually points at approval routing, not capacity",
    minRange: 1,
    maxRange: 25,
    step: 0.5,
  },
  {
    field_id: "ap_11",
    metric: "Paid on time against terms",
    unit: "percentage",
    shortUnit: "%",
    global_benchmark: 95,
    india_benchmark: 70,
    commonly_observed: "20-50",
    betterDirection: "higher",
    read: "The headline AP service metric. Below 60% is almost always an approval bottleneck rather than a deliberate cash decision",
    minRange: 0,
    maxRange: 100,
    step: 1,
  },
  {
    field_id: "ap_10",
    metric: "Days Payable Outstanding",
    unit: "days",
    shortUnit: "days",
    global_benchmark: 45,
    india_benchmark: 55,
    commonly_observed: "40-70",
    betterDirection: "contextual",
    read: "Read against agreed terms, never on its own. High DPO with low paid-on-time means late payment, not working capital management",
    minRange: 15,
    maxRange: 120,
    step: 1,
  },
  {
    field_id: "ap_14",
    metric: "Early payment discount capture",
    unit: "percentage",
    shortUnit: "%",
    global_benchmark: 85,
    india_benchmark: 45,
    commonly_observed: "under 50",
    betterDirection: "higher",
    read: "Directly quantifiable missed savings. Low capture alongside slow cycle time is the clearest cost-of-delay argument available",
    minRange: 0,
    maxRange: 100,
    step: 1,
  },
  {
    field_id: "ap_derived",
    metric: "Invoices processed per AP FTE",
    unit: "'000 p.a.",
    shortUnit: "k / yr",
    global_benchmark: 44,
    india_benchmark: 40,
    commonly_observed: "12-25",
    betterDirection: "higher",
    read: "Compare only after normalising for non-PO mix. A low figure with high non-PO share is a process problem, not a people problem",
    minRange: 5,
    maxRange: 60,
    step: 1,
  },
  {
    field_id: "ap_12",
    metric: "Payments made electronically",
    unit: "percentage",
    shortUnit: "%",
    global_benchmark: 98,
    india_benchmark: 75,
    commonly_observed: "5-40",
    betterDirection: "higher",
    read: "Cheque volume carries cost, delay and fraud exposure. Usually the cheapest win available and rarely contested",
    minRange: 0,
    maxRange: 100,
    step: 1,
  },
  {
    field_id: "ap_13",
    metric: "Distinct payment terms in use",
    unit: "count",
    shortUnit: "terms",
    global_benchmark: 8,
    india_benchmark: 20,
    commonly_observed: "30-80",
    betterDirection: "lower",
    read: "A long tail of terms makes on-time payment unmeasurable, so fix this before trying to improve the paid-on-time number",
    minRange: 1,
    maxRange: 100,
    step: 1,
  },
  {
    field_id: "ap_17",
    metric: "Vendor queries per 1,000 invoices",
    unit: "count",
    shortUnit: "per 1k inv",
    global_benchmark: 15,
    india_benchmark: 40,
    commonly_observed: "50-120",
    betterDirection: "lower",
    read: "Normalise the monthly query count against invoice volume before comparing. High query load usually tracks late payment, not vendor behaviour",
    minRange: 0,
    maxRange: 200,
    step: 1,
  },
];

export interface NumericMetricsMap {
  ap_03?: number; // Monthly invoice volume
  ap_04?: number; // PO-backed %
  ap_08?: number; // Exception rate %
  ap_09?: number; // Receipt-to-posting days
  ap_10?: number; // DPO days
  ap_11?: number; // Paid on time %
  ap_12?: number; // Electronic payments %
  ap_13?: number; // Distinct payment terms count
  ap_14?: number; // Early payment discount capture %
  ap_17?: number; // Monthly vendor queries raw OR per 1000
  ap_19?: number; // AP FTE count
}

export interface BenchmarkEvaluation {
  spec: BenchmarkSpec;
  clientValue: number | null;
  formattedClient: string;
  position: "ahead" | "near" | "behind" | "needs-pair" | "missing";
  positionLabel: string;
  interpretation: string;
  dependencyWarning?: string;
}

/**
 * Implements the rules from context/skills/benchmark-interpreter/SKILL.md:
 * - Resolves derived metrics (ap_derived from ap_03 & ap_19; ap_17 per 1,000 invoices)
 * - Enforces paired-metric rules (DPO requires Paid-on-Time; Exception rate references PO coverage;
 *   Invoices per FTE normalizes for non-PO mix; Paid-on-Time notes payment terms tail)
 */
export function evaluateAllBenchmarks(metrics: NumericMetricsMap): BenchmarkEvaluation[] {
  const monthlyVolume = metrics.ap_03;
  const ftes = metrics.ap_19;
  const poShare = metrics.ap_04;
  const paidOnTime = metrics.ap_11;
  const termsCount = metrics.ap_13;

  return AP_BENCHMARKS.map((spec) => {
    let clientValue: number | null = null;
    let dependencyWarning: string | undefined;

    if (spec.field_id === "ap_derived") {
      if (monthlyVolume && ftes && ftes > 0) {
        clientValue = Math.round(((monthlyVolume * 12) / ftes / 1000) * 10) / 10;
        if (poShare === undefined) {
          dependencyWarning =
            "Requires PO-backed share (ap_04) to normalise for non-PO manual effort before judging team productivity.";
        } else if (poShare < 80) {
          dependencyWarning = `Normalise for ${100 - poShare}% non-PO share: low throughput here is a process problem, not a people capability problem.`;
        }
      } else {
        dependencyWarning = "Needs monthly invoice volume (ap_03) and AP FTE count (ap_19) to compute.";
      }
    } else if (spec.field_id === "ap_17") {
      if (metrics.ap_17 !== undefined) {
        // If ap_17 > 200 and monthlyVolume exists, treat ap_17 as monthly raw count and normalise per 1,000 invoices
        if (monthlyVolume && monthlyVolume > 0 && metrics.ap_17 > 150) {
          clientValue = Math.round((metrics.ap_17 / monthlyVolume) * 1000);
          dependencyWarning = `Normalised from ${metrics.ap_17.toLocaleString()} queries/mo ÷ ${monthlyVolume.toLocaleString()} invoices/mo × 1,000.`;
        } else if (monthlyVolume && monthlyVolume > 0) {
          // Check whether user gave raw monthly queries or already per-1000
          clientValue =
            metrics.ap_17 > 120
              ? Math.round((metrics.ap_17 / monthlyVolume) * 1000)
              : Math.round(metrics.ap_17);
        } else {
          clientValue = Math.round(metrics.ap_17);
          dependencyWarning = "Needs monthly invoice volume (ap_03) to confirm per-1,000 normalisation.";
        }
      }
    } else {
      const val = metrics[spec.field_id as keyof NumericMetricsMap];
      if (val !== undefined && !Number.isNaN(val)) {
        clientValue = val;
      }
    }

    if (clientValue === null) {
      return {
        spec,
        clientValue: null,
        formattedClient: "—",
        position: "missing",
        positionLabel: "Not established",
        interpretation: spec.read,
        dependencyWarning,
      };
    }

    const formattedClient = `${clientValue}${spec.shortUnit === "%" ? "%" : ` ${spec.shortUnit}`}`;

    // Special rule: DPO (ap_10) cannot be read without Paid on Time (ap_11)
    if (spec.field_id === "ap_10") {
      if (paidOnTime === undefined) {
        return {
          spec,
          clientValue,
          formattedClient,
          position: "needs-pair",
          positionLabel: "Needs Paid-on-Time",
          interpretation:
            "This metric needs Paid-on-Time (ap_11) to interpret. High DPO without Paid-on-Time cannot distinguish working capital discipline from late payment.",
          dependencyWarning: "Refusing standalone DPO read per EY benchmark-interpreter protocol: provide ap_11.",
        };
      }
      const isLateDriven = paidOnTime < 60;
      return {
        spec,
        clientValue,
        formattedClient,
        position: isLateDriven ? "behind" : "near",
        positionLabel: isLateDriven ? "Driven by Lateness" : "Aligned with Terms",
        interpretation: isLateDriven
          ? `At ${clientValue} days (India: ${spec.india_benchmark}d, Global: ${spec.global_benchmark}d) alongside ${paidOnTime}% paid on time, this DPO is achieved through payment delay rather than negotiated working capital terms.`
          : `At ${clientValue} days alongside ${paidOnTime}% paid on time, DPO reflects genuine terms management rather than process delay.`,
      };
    }

    if (spec.field_id === "ap_08" && poShare !== undefined && poShare < 80) {
      dependencyWarning = `Directly linked to ${poShare}% PO coverage (${100 - poShare}% non-PO spend bypassing automated matching).`;
    }

    if (spec.field_id === "ap_11" && termsCount !== undefined && termsCount > 20) {
      dependencyWarning = `Caveat: ${termsCount} distinct payment terms in use (above India peer point of 20) makes on-time payment difficult to manage or measure cleanly.`;
    }

    // Position vs India benchmark
    const india = spec.india_benchmark;
    const tolerance = spec.shortUnit === "days" ? 1 : Math.max(2, india * 0.1);
    let position: "ahead" | "near" | "behind" = "near";

    if (spec.betterDirection === "higher") {
      if (clientValue >= india + tolerance) position = "ahead";
      else if (clientValue <= india - tolerance) position = "behind";
      else position = "near";
    } else if (spec.betterDirection === "lower") {
      if (clientValue <= india - tolerance) position = "ahead";
      else if (clientValue >= india + tolerance) position = "behind";
      else position = "near";
    }

    const positionLabel =
      position === "ahead"
        ? "Ahead of India Peer"
        : position === "near"
          ? "Near India Peer"
          : "Behind India Peer";

    return {
      spec,
      clientValue,
      formattedClient,
      position,
      positionLabel,
      interpretation: spec.read,
      dependencyWarning,
    };
  });
}

export interface InvoiceExtractRow {
  invoice_id: string;
  vendor: string;
  amount_inr: number;
  po_backed: boolean;
  days_to_approval: number;
  exception_flag: boolean;
  paid_on_time: boolean;
}

export interface ExtractAnalysisResult {
  rowCount: number;
  totalAmountInr: number;
  poBackedCount: number;
  nonPoCount: number;
  poBackedPct: number;
  exceptionCount: number;
  exceptionRatePct: number;
  paidOnTimeCount: number;
  paidOnTimePct: number;
  avgApprovalDays: number;
  crossTab: {
    poBacked: {
      count: number;
      exceptionCount: number;
      exceptionPct: number;
      avgApprovalDays: number;
      paidOnTimeCount: number;
      paidOnTimePct: number;
    };
    nonPo: {
      count: number;
      exceptionCount: number;
      exceptionPct: number;
      avgApprovalDays: number;
      paidOnTimeCount: number;
      paidOnTimePct: number;
    };
  };
  vendorConcentration: Array<{
    vendor: string;
    invoiceCount: number;
    amountInr: number;
    sharePct: number;
    poBackedCount: number;
  }>;
  isSmallSample: boolean;
}

/**
 * Implements the exact calculation recipes and cross-tabulations from
 * context/skills/file-reader/SKILL.md.
 */
export function analyzeInvoiceExtractCsv(csvText: string): ExtractAnalysisResult | null {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxPo = headers.indexOf("po_backed");
  const idxDays = headers.indexOf("days_to_approval");
  const idxExc = headers.indexOf("exception_flag");
  const idxOtp = headers.indexOf("paid_on_time");
  const idxVendor = headers.indexOf("vendor");
  const idxAmount = headers.indexOf("amount_inr");

  if (idxPo === -1 || idxExc === -1 || idxOtp === -1) {
    return null;
  }

  const rows: InvoiceExtractRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < headers.length) continue;
    rows.push({
      invoice_id: cols[0] ?? `ROW-${i}`,
      vendor: idxVendor !== -1 ? (cols[idxVendor] ?? "Unknown") : "Unknown",
      amount_inr: idxAmount !== -1 ? Number(cols[idxAmount]) || 0 : 0,
      po_backed: /^(yes|true|1|y)$/i.test((cols[idxPo] ?? "").trim()),
      days_to_approval: idxDays !== -1 ? Number(cols[idxDays]) || 0 : 0,
      exception_flag: /^(yes|true|1|y)$/i.test((cols[idxExc] ?? "").trim()),
      paid_on_time: /^(yes|true|1|y)$/i.test((cols[idxOtp] ?? "").trim()),
    });
  }

  if (rows.length === 0) return null;

  const rowCount = rows.length;
  const totalAmountInr = rows.reduce((sum, r) => sum + r.amount_inr, 0);
  const poRows = rows.filter((r) => r.po_backed);
  const nonPoRows = rows.filter((r) => !r.po_backed);

  const poBackedCount = poRows.length;
  const nonPoCount = nonPoRows.length;
  const exceptionCount = rows.filter((r) => r.exception_flag).length;
  const paidOnTimeCount = rows.filter((r) => r.paid_on_time).length;
  const avgApprovalDays =
    Math.round((rows.reduce((sum, r) => sum + r.days_to_approval, 0) / rowCount) * 10) / 10;

  const summarizeGroup = (group: InvoiceExtractRow[]) => {
    const count = group.length;
    if (count === 0) {
      return {
        count: 0,
        exceptionCount: 0,
        exceptionPct: 0,
        avgApprovalDays: 0,
        paidOnTimeCount: 0,
        paidOnTimePct: 0,
      };
    }
    const exc = group.filter((r) => r.exception_flag).length;
    const otp = group.filter((r) => r.paid_on_time).length;
    const avgDays =
      Math.round((group.reduce((s, r) => s + r.days_to_approval, 0) / count) * 10) / 10;
    return {
      count,
      exceptionCount: exc,
      exceptionPct: Math.round((exc / count) * 100),
      avgApprovalDays: avgDays,
      paidOnTimeCount: otp,
      paidOnTimePct: Math.round((otp / count) * 100),
    };
  };

  const vendorMap = new Map<
    string,
    { invoiceCount: number; amountInr: number; poBackedCount: number }
  >();
  for (const r of rows) {
    const prev = vendorMap.get(r.vendor) ?? {
      invoiceCount: 0,
      amountInr: 0,
      poBackedCount: 0,
    };
    prev.invoiceCount += 1;
    prev.amountInr += r.amount_inr;
    if (r.po_backed) prev.poBackedCount += 1;
    vendorMap.set(r.vendor, prev);
  }

  const vendorConcentration = Array.from(vendorMap.entries())
    .map(([vendor, stats]) => ({
      vendor,
      invoiceCount: stats.invoiceCount,
      amountInr: stats.amountInr,
      sharePct:
        totalAmountInr > 0
          ? Math.round((stats.amountInr / totalAmountInr) * 1000) / 10
          : 0,
      poBackedCount: stats.poBackedCount,
    }))
    .sort((a, b) => b.amountInr - a.amountInr);

  return {
    rowCount,
    totalAmountInr,
    poBackedCount,
    nonPoCount,
    poBackedPct: Math.round((poBackedCount / rowCount) * 100),
    exceptionCount,
    exceptionRatePct: Math.round((exceptionCount / rowCount) * 100),
    paidOnTimeCount,
    paidOnTimePct: Math.round((paidOnTimeCount / rowCount) * 100),
    avgApprovalDays,
    crossTab: {
      poBacked: summarizeGroup(poRows),
      nonPo: summarizeGroup(nonPoRows),
    },
    vendorConcentration,
    isSmallSample: rowCount < 50,
  };
}

export const SAMPLE_EMAIL_FILENAME = "sample-email-from-ap-manager.txt";
export const SAMPLE_EMAIL_CONTENT = `SAMPLE - fictional, for the workshop only.

From: priya.menon@northwind-example.com
To: ap-diagnostic-agent
Subject: Re: a few numbers you asked for

Hi,

Following up from our chat. Pulled these from last month's close:

- We processed 8,412 invoices in August.
- Around 40% do not have a PO attached, mostly from the facilities and marketing teams who order directly from vendors.
- Our SAP setup does have OCR turned on for the scanned invoices, but a lot still come in as PDF attachments in email that someone has to key in by hand.
- On the approval side, anything above 50k INR needs sign-off from both the cost center head and the finance controller. The controller is often traveling, so that step alone can add 3-4 days.
- I don't have an exact number for discount capture but I know we miss a lot of early payment terms because by the time an invoice clears approval, the discount window is already gone.

Let me know what else you need.

Priya`;

export const SAMPLE_EXTRACT_FILENAME = "sample-invoice-aging-extract.csv";
export const SAMPLE_EXTRACT_CONTENT = `invoice_id,vendor,amount_inr,po_backed,days_to_approval,exception_flag,paid_on_time
INV-10023,Global Steel Traders,412000,yes,2,no,yes
INV-10024,Office Basics Pvt Ltd,18500,no,6,yes,no
INV-10025,Global Steel Traders,398000,yes,1,no,yes
INV-10026,Marketing Collective,64000,no,9,yes,no
INV-10027,Facilities First,22000,no,4,no,yes
INV-10028,Global Steel Traders,405000,yes,2,no,yes
INV-10029,Office Basics Pvt Ltd,15200,no,7,yes,no
INV-10030,IT Hardware Solutions,132000,yes,3,no,yes
INV-10031,Marketing Collective,58000,no,11,yes,no
INV-10032,Facilities First,19800,no,5,no,yes`;

export const HARLOW_REFERENCE_CASE: {
  clientName: string;
  metrics: NumericMetricsMap;
  checklistAnswers: Record<string, string>;
} = {
  clientName: "Harlow Industrial Components",
  metrics: {
    ap_03: 12000,
    ap_04: 62,
    ap_08: 18,
    ap_09: 6,
    ap_10: 58,
    ap_11: 41,
    ap_12: 55,
    ap_13: 47,
    ap_14: 38,
    ap_17: 900, // 75 per 1,000 invoices on 12,000/mo
    ap_19: 9,
  },
  checklistAnswers: {
    ap_01: "3,150 active vendors in ERP (with a long tail of one-time vendors)",
    ap_02: "Same AP processing team that posts invoices can create and amend vendor records",
    ap_03: "12,000 invoices per month (~144,000 p.a.)",
    ap_04: "62% PO-backed, 38% non-PO",
    ap_05: "Mix of email PDFs (65%), paper post (20%), and EDI (15%)",
    ap_06: "Yes, OCR is in place, but low PO coverage blocks automated matching",
    ap_07: "Three-way match enabled, but tight tolerance trips on freight variance",
    ap_08: "18% exception rate requiring manual resolution",
    ap_09: "6 days average from invoice receipt to posting",
    ap_10: "58 days average Days Payable Outstanding",
    ap_11: "41% of invoices paid on time against agreed terms",
    ap_12: "55% electronic payments, 45% still by cheque",
    ap_13: "47 distinct payment terms across the vendor base",
    ap_14: "38% of eligible early-payment discounts captured",
    ap_15: "Multi-step manual routing; invoices sit in approver inboxes with no ageing escalation",
    ap_16: "Reviewed monthly and cleared within the quarter",
    ap_17: "~900 vendor queries per month (~75 per 1,000 invoices)",
    ap_18: "MSME vendors flagged in ERP, but late-payment interest exposure tracked manually in a spreadsheet",
    ap_19: "9 FTEs in the AP function (~16,000 invoices per FTE p.a.)",
    ap_20: "38% non-PO invoices bypassing matching and waiting in approver inboxes without escalation",
    ap_21: "No independent review or approval before vendor creation/amendment goes live",
    ap_22: "No formal dual-approval or mandatory callback protocol on bank-detail changes",
  },
};

export interface SubProcessStage {
  id: string;
  stepNumber: string;
  title: string;
  skillName: string;
  fields: string[];
  headlineBenchmark: string;
  keyRiskPattern: string;
  automationLever: string;
}

export const AP_SUBPROCESS_STAGES: SubProcessStage[] = [
  {
    id: "procurement",
    stepNumber: "01",
    title: "Procurement & PO Discipline",
    skillName: "procurement-review",
    fields: ["ap_04", "ap_03"],
    headlineBenchmark: "95% Global · 85% India PO-Backed",
    keyRiskPattern:
      "Retrospective POs raised after invoice receipt or a no-PO-no-pay policy with no mandate for AP to reject breaches.",
    automationLever:
      "No-PO-no-pay policy with a defined exception list + guided buying catalogues.",
  },
  {
    id: "intake",
    stepNumber: "02",
    title: "Invoice Intake & OCR Capture",
    skillName: "invoice-processing-review",
    fields: ["ap_03", "ap_05", "ap_06"],
    headlineBenchmark: "44k Global · 40k India Inv / FTE",
    keyRiskPattern:
      "OCR bought and stranded: email PDFs keyed manually or OCR output re-validated 100% by hand due to low PO coverage.",
    automationLever:
      "Touchless email/portal ingestion paired with upstream PO discipline.",
  },
  {
    id: "matching",
    stepNumber: "03",
    title: "Goods Receipt & 3-Way Match",
    skillName: "grn-review",
    fields: ["ap_07", "ap_08", "ap_16"],
    headlineBenchmark: "2% Global · 8% India Exception Rate",
    keyRiskPattern:
      "Tight tolerances manufacturing exceptions on minor freight/rounding variances; unowned GR-IR ageing cleared by write-back.",
    automationLever:
      "Calibrate price/quantity match tolerances & automate service receipt confirmations.",
  },
  {
    id: "routing",
    stepNumber: "04",
    title: "Approval Routing & Posting",
    skillName: "invoice-processing-review",
    fields: ["ap_09", "ap_15", "ap_20"],
    headlineBenchmark: "2d Global · 4d India Receipt-to-Post",
    keyRiskPattern:
      "Cycle time above 5 days misdiagnosed as AP capacity when invoices sit in travelling approvers' inboxes with no substitute rule.",
    automationLever:
      "Ageing-based workflow escalation, substitute approver rules & weekly approver league tables.",
  },
  {
    id: "payments",
    stepNumber: "05",
    title: "Payment Run & Working Capital",
    skillName: "payment-run-review",
    fields: ["ap_10", "ap_11", "ap_12", "ap_13", "ap_14", "ap_18"],
    headlineBenchmark: "95% Global · 70% India Paid-on-Time",
    keyRiskPattern:
      "High DPO achieved via late payment; 40+ distinct payment terms; early-payment discounts lost to upstream approval delay.",
    automationLever:
      "Standardise payment terms to 5–8 bands, convert cheques to electronic runs & dynamic discounting.",
  },
  {
    id: "vendormaster",
    stepNumber: "06",
    title: "Vendor Master & Query Control",
    skillName: "vendor-master-review",
    fields: ["ap_01", "ap_02", "ap_17", "ap_21", "ap_22"],
    headlineBenchmark: "15 Global · 40 India Queries / 1k Inv",
    keyRiskPattern:
      "Urgent control gap: invoice processors can create/amend vendors and update bank details without dual approval or callback.",
    automationLever:
      "Segregate vendor master from transaction processing, enforce bank callback verification & vendor status portal.",
  },
];
