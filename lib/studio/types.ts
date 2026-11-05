export type StudioSectionId =
  | "overview"
  | "interview"
  | "data"
  | "process"
  | "benchmarks"
  | "root-causes"
  | "opportunities"
  | "value"
  | "roadmap"
  | "report";

export type CompletionState = "completed" | "in-progress" | "not-started";

export type KpiId =
  | "invoices_per_fte"
  | "cost_per_invoice"
  | "cycle_time_days"
  | "touchless_rate"
  | "po_backed_rate"
  | "exception_rate"
  | "on_time_payment_rate"
  | "discount_capture_rate"
  | "vendor_query_rate"
  | "automation_maturity"
  | "dpo_days";

export type InterviewCategoryId =
  | "org-scope"
  | "invoice-volumes"
  | "process-workflow"
  | "technology-systems"
  | "workforce-model"
  | "controls-compliance"
  | "performance-kpis"
  | "challenges-pain-points";

export type QuestionControlType =
  | "number"
  | "percentage"
  | "currency"
  | "yes-no"
  | "select"
  | "multi-select"
  | "text"
  | "date";

export interface InterviewQuestion {
  id: string;
  fieldCode: string;
  categoryId: InterviewCategoryId;
  title: string;
  question: string;
  contextExplanation: string;
  controlType: QuestionControlType;
  unit?: string;
  options?: string[];
  suggestedAnswers: string[];
  followUpPrompt: string;
  requiredEvidence: string;
  linkedKpiId?: KpiId;
  linkedStageIds: string[];
  linkedRootCauseIds: string[];
  answer: string;
  numericValue?: number;
  status: "answered" | "skipped" | "unanswered";
  notes?: string;
  attachedDatasetIds: string[];
  updatedAt?: string;
}

export interface DataValidationIssue {
  id: string;
  type:
    | "missing_values"
    | "duplicate_records"
    | "invalid_dates"
    | "missing_vendor_ids"
    | "missing_po_refs"
    | "invalid_currency"
    | "unusual_payment_pattern";
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
  description: string;
  affectedField: string;
}

export interface DataDataset {
  id: string;
  datasetType:
    | "AP Invoice Extract"
    | "Invoice Aging Report"
    | "Vendor Master"
    | "Purchase Order Extract"
    | "Payment Extract"
    | "GL Extract"
    | "Process Documentation"
    | "SOPs"
    | "Other Evidence";
  fileName: string;
  records: number;
  dataPeriod: string;
  status: "Verified" | "Warnings" | "Needs Review" | "Pending Upload";
  description: string;
  isUploadedByUser: boolean;
  sourceType: "demo-baseline" | "user-uploaded";
  lastUpdated: string;
  validationIssues: DataValidationIssue[];
  linkedQuestionIds: string[];
  linkedKpiIds: KpiId[];
  linkedStageIds: string[];
  linkedRootCauseIds: string[];
  linkedOpportunityIds: string[];
  parsedSummary?: {
    totalSpendUsd?: number;
    poBackedPct?: number;
    exceptionPct?: number;
    onTimePct?: number;
    avgCycleDays?: number;
    duplicateCandidates?: number;
  };
}

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export interface ProcessStageAssessment {
  id: string;
  order: number;
  name: string;
  shortName: string;
  description: string;
  currentStateWorkflow: string;
  systemsInvolved: string[];
  activities: string[];
  controls: string[];
  roles: string[];
  processOwner: string;
  maturityScore: MaturityLevel;
  targetMaturityScore: MaturityLevel;
  automationLevelPct: number;
  standardizationScore: MaturityLevel;
  controlEffectivenessScore: MaturityLevel;
  benchmarkMaturityScore: number;
  painPoints: string[];
  linkedKpiIds: KpiId[];
  linkedDatasetIds: string[];
  linkedRootCauseIds: string[];
  linkedOpportunityIds: string[];
}

export type RootCauseCategory =
  | "Process"
  | "Technology"
  | "People"
  | "Data"
  | "Governance"
  | "Policy"
  | "Supplier behavior"
  | "Organizational structure";

export interface RootCauseItem {
  id: string;
  code: string;
  title: string;
  category: RootCauseCategory;
  observedKpiId: KpiId;
  performanceGapSummary: string;
  rootCauseStatement: string;
  whyItHappens: string;
  businessImpactSummary: string;
  estimatedAnnualImpactUsd: number;
  improvementLever: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  affectedStageIds: string[];
  linkedDatasetIds: string[];
  linkedOpportunityIds: string[];
}

export type OpportunityStatus = "Selected" | "Under Assessment" | "Rejected";

export interface OpportunityItem {
  id: string;
  code: string;
  name: string;
  description: string;
  processStageIds: string[];
  currentPainPoint: string;
  proposedSolution: string;
  automationType: "Process & Policy" | "RPA / Workflow" | "OCR / IDP" | "Agentic AI / ML" | "ERP Native";
  aiApplicability: "High — Generative / Agentic AI" | "Medium — ML Classification" | "Deterministic Rules";
  complexityScore: number; // 1-10 (10 = highest complexity)
  valueScore: number; // 1-10 (10 = highest business value)
  complexityLabel: "Low" | "Medium" | "High";
  businessValueLabel: "High" | "Medium" | "Low";
  riskLevel: "Low" | "Medium" | "High";
  dependencies: string[];
  priority: "P1 — Immediate" | "P2 — Near-Term" | "P3 — Medium-Term";
  status: OpportunityStatus;
  includeInRoadmap: boolean;
  comments: string;
  estimatedAnnualBenefitUsd: number;
  estimatedImplementationCostUsd: number;
  effortWeeks: number;
  currentStateDetail: string;
  futureStateDetail: string;
  solutionArchitecture: string;
  requiredCapabilities: string[];
  dataRequirements: string[];
  technologyConsiderations: string;
  riskConsiderations: string;
  implementationApproach: string;
  linkedKpiIds: KpiId[];
  linkedRootCauseIds: string[];
  linkedDatasetIds: string[];
  targetSuccessMetric: string;
}

export type ValueScenario = "Conservative" | "Base Case" | "Optimistic";

export interface ValueAssumptions {
  annualInvoiceVolume: number;
  apHeadcount: number;
  avgAnnualEmployeeCostUsd: number;
  costPerInvoiceUsd: number;
  currentAutomationRatePct: number;
  targetAutomationRatePct: number;
  exceptionRatePct: number;
  targetExceptionRatePct: number;
  avgExceptionHandlingCostUsd: number;
  manualHandlingMinutesPerInvoice: number;
  discountCaptureRatePct: number;
  targetDiscountCaptureRatePct: number;
  eligibleDiscountSpendUsd: number;
  avgDiscountRatePct: number;
  annualSpendUsd: number;
  duplicatePaymentRatePct: number;
  duplicateRecoveryPreventionPct: number;
  latePaymentPenaltiesAnnualUsd: number;
  latePaymentReductionPct: number;
  dpoImprovementDays: number;
  costOfCapitalPct: number;
  monthlyVendorQueries: number;
  costPerQueryUsd: number;
  queryReductionPct: number;
  implementationCostUsd: number;
  recurringTechCostAnnualUsd: number;
}

export type RoadmapWave =
  | "Wave 1 — Stabilize & Standardize"
  | "Wave 2 — Automate & Optimize"
  | "Wave 3 — Intelligent Finance";

export interface RoadmapInitiative {
  id: string;
  code: string;
  name: string;
  description: string;
  processArea: string;
  linkedOpportunityId?: string;
  wave: RoadmapWave;
  businessValueUsd: number;
  implementationCostUsd: number;
  effortWeeks: number;
  dependencies: string[];
  owner: string;
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM
  status: "Planned" | "In Progress" | "Completed" | "At Risk";
  priority: "Critical" | "High" | "Medium";
  milestones: Array<{ id: string; title: string; dueMonth: string; completed: boolean }>;
  successKpi: string;
}

export interface BenchmarkFilterState {
  industry: "Industrial Manufacturing" | "Consumer Goods" | "Technology & Telecom" | "Life Sciences" | "All Industries";
  companySize: "$250M – $1B Revenue" | "< $250M Revenue" | "> $1B Enterprise" | "All Sizes";
  region: "Global Peer Group" | "North America & Europe" | "India & APAC SSC" | "Emerging Markets";
  complexity: "High Multi-Entity" | "Moderate" | "Single ERP";
  dataPeriod: "FY2026 Rolling 12M" | "FY2025 Full Year" | "Q1–Q3 Benchmark";
}

export interface ReportConfigState {
  reportTitle: string;
  subtitle: string;
  preparedFor: string;
  preparedBy: string;
  theme: "ey-executive-navy" | "ey-classic-charcoal" | "boardroom-light";
  executiveSummaryText: string;
  clientOverviewText: string;
  keyRecommendationsText: string;
  risksAndDependenciesText: string;
  nextStepsNarrative: string;
  assumptionsNoteText: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  targetSection?: StudioSectionId;
}

export type DrilldownTarget =
  | { type: "kpi"; kpiId: KpiId }
  | { type: "stage"; stageId: string }
  | { type: "root-cause"; rootCauseId: string }
  | { type: "opportunity"; opportunityId: string }
  | { type: "dataset"; datasetId: string }
  | null;
