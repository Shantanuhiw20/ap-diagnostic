"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Papa from "papaparse";
import type {
  BenchmarkFilterState,
  CompletionState,
  DataDataset,
  DataValidationIssue,
  DrilldownTarget,
  InterviewQuestion,
  KpiId,
  NotificationItem,
  OpportunityItem,
  ProcessStageAssessment,
  ReportConfigState,
  RoadmapInitiative,
  RoadmapWave,
  RootCauseItem,
  StudioSectionId,
  ValueAssumptions,
  ValueScenario,
} from "./types";
import {
  INITIAL_BENCHMARK_FILTERS,
  INITIAL_DATASETS,
  INITIAL_INTERVIEW_QUESTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OPPORTUNITIES,
  INITIAL_PROCESS_STAGES,
  INITIAL_REPORT_CONFIG,
  INITIAL_ROADMAP_INITIATIVES,
  INITIAL_ROOT_CAUSES,
  INITIAL_VALUE_ASSUMPTIONS,
} from "./seed-data";
import {
  computeAllKpiBenchmarks,
  computeValueRealization,
  deriveCoreMetrics,
  type KpiBenchmarkDetail,
  type ValueRealizationSummary,
} from "./calculations";

const STORAGE_KEY = "ey_ap_diagnostic_studio_v1";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning";
}

interface PersistedStudioState {
  clientName: string;
  engagementName: string;
  engagementStatus: "In Diagnostic" | "Benchmarking & Value Case" | "Ready for Executive Sign-Off";
  activeSection: StudioSectionId;
  activeInterviewCategoryId: string;
  activeQuestionId: string;
  questions: InterviewQuestion[];
  datasets: DataDataset[];
  processStages: ProcessStageAssessment[];
  benchmarkFilters: BenchmarkFilterState;
  rootCauses: RootCauseItem[];
  opportunities: OpportunityItem[];
  valueAssumptions: ValueAssumptions;
  activeScenario: ValueScenario;
  roadmapInitiatives: RoadmapInitiative[];
  reportConfig: ReportConfigState;
  notifications: NotificationItem[];
  visitedSections: StudioSectionId[];
  lastSavedAt: string;
  isDemoMode: boolean;
}

function getDefaultState(): PersistedStudioState {
  return {
    clientName: "Harlow Industrial Components",
    engagementName: "Current-State AP Diagnostic | Finance Transformation",
    engagementStatus: "Benchmarking & Value Case",
    activeSection: "overview",
    activeInterviewCategoryId: "invoice-volumes",
    activeQuestionId: "q_vol_02",
    questions: INITIAL_INTERVIEW_QUESTIONS,
    datasets: INITIAL_DATASETS,
    processStages: INITIAL_PROCESS_STAGES,
    benchmarkFilters: INITIAL_BENCHMARK_FILTERS,
    rootCauses: INITIAL_ROOT_CAUSES,
    opportunities: INITIAL_OPPORTUNITIES,
    valueAssumptions: INITIAL_VALUE_ASSUMPTIONS,
    activeScenario: "Base Case",
    roadmapInitiatives: INITIAL_ROADMAP_INITIATIVES,
    reportConfig: INITIAL_REPORT_CONFIG,
    notifications: INITIAL_NOTIFICATIONS,
    visitedSections: [
      "overview",
      "interview",
      "data",
      "process",
      "benchmarks",
      "root-causes",
      "opportunities",
      "value",
      "roadmap",
    ],
    lastSavedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isDemoMode: true,
  };
}

interface StudioContextValue extends PersistedStudioState {
  navigationHistory: StudioSectionId[];
  canGoBack: boolean;
  drilldown: DrilldownTarget;
  toasts: ToastMessage[];
  coreMetrics: ReturnType<typeof deriveCoreMetrics>;
  kpiBenchmarks: KpiBenchmarkDetail[];
  valueSummary: ValueRealizationSummary;
  sectionCompletion: Record<StudioSectionId, { state: CompletionState; pct: number; detail: string }>;
  overallCompletionPct: number;

  // Navigation & UI
  navigateTo: (section: StudioSectionId, options?: { pushHistory?: boolean }) => void;
  goBack: () => void;
  openDrilldown: (target: DrilldownTarget) => void;
  closeDrilldown: () => void;
  openKpiDrilldown: (kpiId: KpiId) => void;
  pushToast: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  dismissToast: (id: string) => void;
  markAllNotificationsRead: () => void;
  saveNow: () => void;

  // Client & Session
  setClientName: (name: string) => void;
  setEngagementStatus: (status: PersistedStudioState["engagementStatus"]) => void;
  resetToHarlowBaseline: () => void;

  // Interview
  setActiveInterviewCategory: (catId: string) => void;
  setActiveQuestion: (qId: string) => void;
  updateQuestionAnswer: (questionId: string, answer: string, notes?: string) => void;
  skipQuestion: (questionId: string) => void;
  toggleDatasetOnQuestion: (questionId: string, datasetId: string) => void;

  // Data & Evidence
  uploadDatasetFile: (
    file: File,
    datasetType: DataDataset["datasetType"],
    dataPeriod: string,
    description: string,
  ) => Promise<void>;
  removeDataset: (datasetId: string) => void;
  updateDatasetLinks: (
    datasetId: string,
    links: Partial<
      Pick<
        DataDataset,
        "linkedKpiIds" | "linkedStageIds" | "linkedRootCauseIds" | "linkedOpportunityIds"
      >
    >,
  ) => void;

  // Process Assessment
  updateProcessStage: (
    stageId: string,
    patch: Partial<ProcessStageAssessment>,
  ) => void;

  // Benchmarks
  updateBenchmarkFilters: (patch: Partial<BenchmarkFilterState>) => void;

  // Root Causes
  addRootCause: (rc: Omit<RootCauseItem, "id" | "code">) => void;
  updateRootCause: (id: string, patch: Partial<RootCauseItem>) => void;
  deleteRootCause: (id: string) => void;

  // Opportunities
  updateOpportunity: (id: string, patch: Partial<OpportunityItem>) => void;
  toggleOpportunityRoadmap: (id: string) => void;

  // Value Realization
  updateValueAssumptions: (patch: Partial<ValueAssumptions>) => void;
  setActiveScenario: (scenario: ValueScenario) => void;

  // Transformation Roadmap
  addRoadmapInitiative: (init: Omit<RoadmapInitiative, "id" | "code">) => void;
  updateRoadmapInitiative: (id: string, patch: Partial<RoadmapInitiative>) => void;
  moveInitiativeWave: (id: string, wave: RoadmapWave) => void;
  toggleInitiativeMilestone: (initiativeId: string, milestoneId: string) => void;
  deleteRoadmapInitiative: (id: string) => void;

  // Executive Report
  updateReportConfig: (patch: Partial<ReportConfigState>) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

const VALID_SECTIONS: StudioSectionId[] = [
  "overview",
  "interview",
  "data",
  "process",
  "benchmarks",
  "root-causes",
  "opportunities",
  "value",
  "roadmap",
  "report",
];

export function StudioProvider({
  children,
  initialSection,
  initialClientName,
}: {
  children: React.ReactNode;
  initialSection?: StudioSectionId;
  initialClientName?: string;
}) {
  const [state, setState] = useState<PersistedStudioState>(() => {
    const fallback = getDefaultState();
    if (initialSection) fallback.activeSection = initialSection;
    if (initialClientName) fallback.clientName = initialClientName;
    return fallback;
  });
  const [hydrated, setHydrated] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<StudioSectionId[]>([]);
  const [drilldown, setDrilldown] = useState<DrilldownTarget>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "success") => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate from localStorage + URL query params on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const params = new URLSearchParams(window.location.search);
        const secParam = params.get("section") as StudioSectionId | null;
        const clientParam = params.get("client");

        setState((prev) => {
          const parsed = raw
            ? (JSON.parse(raw) as Partial<PersistedStudioState>)
            : {};
          const nextSection =
            secParam && VALID_SECTIONS.includes(secParam)
              ? secParam
              : initialSection ?? parsed.activeSection ?? prev.activeSection;
          const nextClient =
            clientParam && clientParam.trim()
              ? clientParam.trim()
              : initialClientName ?? parsed.clientName ?? prev.clientName;

          return {
            ...prev,
            ...parsed,
            activeSection: nextSection,
            clientName: nextClient,
          };
        });
      } catch {
        // Ignore corrupt localStorage
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialSection, initialClientName]);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const secParam = (params.get("section") as StudioSectionId | null) ?? "overview";
      if (VALID_SECTIONS.includes(secParam)) {
        setState((prev) => ({ ...prev, activeSection: secParam }));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Persist to localStorage whenever state updates
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state, hydrated]);

  const touchSaved = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const navigateTo = useCallback(
    (section: StudioSectionId, options?: { pushHistory?: boolean }) => {
      setState((prev) => {
        if (prev.activeSection !== section && options?.pushHistory !== false) {
          setNavigationHistory((h) => [...h.slice(-19), prev.activeSection]);
        }
        const visited = prev.visitedSections.includes(section)
          ? prev.visitedSections
          : [...prev.visitedSections, section];
        return {
          ...prev,
          activeSection: section,
          visitedSections: visited,
          lastSavedAt: touchSaved(),
        };
      });

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.pathname === "/chat") {
          url.pathname = "/";
        }
        url.searchParams.set("section", section);
        window.history.pushState({ section }, "", url.toString());
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [],
  );

  const goBack = useCallback(() => {
    if (drilldown) {
      setDrilldown(null);
      return;
    }
    setNavigationHistory((prev) => {
      if (prev.length === 0) {
        navigateTo("overview", { pushHistory: false });
        return prev;
      }
      const nextHist = [...prev];
      const target = nextHist.pop()!;
      navigateTo(target, { pushHistory: false });
      return nextHist;
    });
  }, [drilldown, navigateTo]);

  const openDrilldown = useCallback((target: DrilldownTarget) => {
    setDrilldown(target);
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(null);
  }, []);

  const openKpiDrilldown = useCallback((kpiId: KpiId) => {
    setDrilldown({ type: "kpi", kpiId });
  }, []);

  const saveNow = useCallback(() => {
    setState((prev) => ({ ...prev, lastSavedAt: touchSaved() }));
    pushToast("Engagement state saved", "All diagnostic inputs, models, and roadmap changes are persisted locally.");
  }, [pushToast]);

  const setClientName = useCallback(
    (clientName: string) => {
      setState((prev) => ({
        ...prev,
        clientName,
        reportConfig: {
          ...prev.reportConfig,
          preparedFor: `${clientName} — Executive Leadership & CFO Office`,
        },
        lastSavedAt: touchSaved(),
      }));
      pushToast("Client updated", `Active diagnostic set to ${clientName}.`);
    },
    [pushToast],
  );

  const setEngagementStatus = useCallback(
    (engagementStatus: PersistedStudioState["engagementStatus"]) => {
      setState((prev) => ({
        ...prev,
        engagementStatus,
        lastSavedAt: touchSaved(),
      }));
      pushToast("Engagement status updated", `Status set to "${engagementStatus}".`);
    },
    [pushToast],
  );

  const resetToHarlowBaseline = useCallback(() => {
    const fresh = getDefaultState();
    setState(fresh);
    setNavigationHistory([]);
    setDrilldown(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    pushToast(
      "Session reset to Harlow baseline",
      "Restored the full Harlow Industrial Components diagnostic dataset.",
      "info",
    );
  }, [pushToast]);

  // Interview actions
  const setActiveInterviewCategory = useCallback((catId: string) => {
    setState((prev) => {
      const firstQ = prev.questions.find((q) => q.categoryId === catId);
      return {
        ...prev,
        activeInterviewCategoryId: catId,
        activeQuestionId: firstQ ? firstQ.id : prev.activeQuestionId,
      };
    });
  }, []);

  const setActiveQuestion = useCallback((qId: string) => {
    setState((prev) => {
      const q = prev.questions.find((item) => item.id === qId);
      return {
        ...prev,
        activeQuestionId: qId,
        activeInterviewCategoryId: q ? q.categoryId : prev.activeInterviewCategoryId,
      };
    });
  }, []);

  const updateQuestionAnswer = useCallback(
    (questionId: string, answer: string, notes?: string) => {
      setState((prev) => {
        const parsedNum = Number(String(answer).replace(/[^0-9.-]/g, ""));
        const validNum = !Number.isNaN(parsedNum) && parsedNum >= 0 ? parsedNum : undefined;

        const nextQuestions = prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answer,
                numericValue: validNum,
                notes: notes !== undefined ? notes : q.notes,
                status: (answer.trim() ? "answered" : "unanswered") as InterviewQuestion["status"],
                updatedAt: new Date().toISOString(),
              }
            : q,
        );

        const targetQ = prev.questions.find((q) => q.id === questionId);
        const nextAssumptions = { ...prev.valueAssumptions };

        // Synchronize numeric interview answers into Value Realization assumptions
        if (targetQ && validNum !== undefined && validNum > 0) {
          if (targetQ.fieldCode === "ap_03") {
            nextAssumptions.annualInvoiceVolume = Math.round(validNum * 12);
          } else if (targetQ.fieldCode === "ap_19") {
            nextAssumptions.apHeadcount = validNum;
          } else if (targetQ.fieldCode === "ap_08") {
            nextAssumptions.exceptionRatePct = Math.min(100, validNum);
          } else if (targetQ.fieldCode === "ap_14") {
            nextAssumptions.discountCaptureRatePct = Math.min(100, validNum);
          } else if (targetQ.fieldCode === "ap_17") {
            nextAssumptions.monthlyVendorQueries = Math.round(validNum);
          } else if (targetQ.fieldCode === "ap_touchless") {
            nextAssumptions.currentAutomationRatePct = Math.min(100, validNum);
          }
        }

        return {
          ...prev,
          questions: nextQuestions,
          valueAssumptions: nextAssumptions,
          lastSavedAt: touchSaved(),
        };
      });
      pushToast("Diagnostic answer saved", "KPIs, benchmarks, and value model updated.");
    },
    [pushToast],
  );

  const skipQuestion = useCallback(
    (questionId: string) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, status: "skipped" } : q,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Question marked as skipped", "Flagged as an open data item in diagnostic completeness.", "info");
    },
    [pushToast],
  );

  const toggleDatasetOnQuestion = useCallback(
    (questionId: string, datasetId: string) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== questionId) return q;
          const exists = q.attachedDatasetIds.includes(datasetId);
          return {
            ...q,
            attachedDatasetIds: exists
              ? q.attachedDatasetIds.filter((id) => id !== datasetId)
              : [...q.attachedDatasetIds, datasetId],
          };
        }),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Evidence linkage updated", "Supporting dataset association saved.");
    },
    [pushToast],
  );

  // Data & Evidence actions with real PapaParse CSV analysis
  const uploadDatasetFile = useCallback(
    async (
      file: File,
      datasetType: DataDataset["datasetType"],
      dataPeriod: string,
      description: string,
    ) => {
      const text = await file.text();
      let recordCount = 1;
      const validationIssues: DataValidationIssue[] = [];
      let parsedSummary: DataDataset["parsedSummary"] = undefined;

      if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const rows = parsed.data;
        recordCount = rows.length;

        if (rows.length > 0) {
          const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
          let missingPoCount = 0;
          let exceptionCount = 0;
          let onTimeCount = 0;
          let totalDays = 0;
          let daysCount = 0;
          let totalSpendUsd = 0;
          let missingVendorCount = 0;
          const seenInvKeys = new Set<string>();
          let duplicateCount = 0;

          rows.forEach((row) => {
            const norm: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              norm[k.toLowerCase().trim()] = String(v ?? "").trim();
            }

            const invId = norm.invoice_id || norm.invoice_number || norm.doc_no || "";
            const vendor = norm.vendor || norm.vendor_id || norm.supplier || "";
            if (!vendor) missingVendorCount++;

            const dupKey = `${vendor}_${ norm.amount_inr || norm.amount || norm.amount_usd || "" }_${invId}`;
            if (invId && seenInvKeys.has(dupKey)) {
              duplicateCount++;
            } else if (invId) {
              seenInvKeys.add(dupKey);
            }

            if ("po_backed" in norm || "po_number" in norm) {
              const val = norm.po_backed ?? norm.po_number ?? "";
              if (!val || /^(no|false|0|n|none|null)$/i.test(val)) {
                missingPoCount++;
              }
            }

            if ("exception_flag" in norm || "exception" in norm) {
              const val = norm.exception_flag ?? norm.exception ?? "";
              if (/^(yes|true|1|y)$/i.test(val)) {
                exceptionCount++;
              }
            }

            if ("paid_on_time" in norm || "on_time" in norm) {
              const val = norm.paid_on_time ?? norm.on_time ?? "";
              if (/^(yes|true|1|y)$/i.test(val)) {
                onTimeCount++;
              }
            }

            const daysVal = Number(norm.days_to_approval ?? norm.cycle_days ?? norm.processing_days);
            if (!Number.isNaN(daysVal) && daysVal > 0) {
              totalDays += daysVal;
              daysCount++;
            }

            const amtVal = Number(
              (norm.amount_usd || norm.amount || norm.amount_inr || "0").replace(/[^0-9.-]/g, ""),
            );
            if (!Number.isNaN(amtVal) && amtVal > 0) {
              totalSpendUsd += norm.amount_inr ? Math.round(amtVal / 83) : amtVal;
            }
          });

          if (missingPoCount > 0) {
            validationIssues.push({
              id: `val_${Date.now()}_po`,
              type: "missing_po_refs",
              label: "Non-PO / Missing PO Reference Rows",
              count: missingPoCount,
              severity: missingPoCount / rows.length > 0.25 ? "high" : "medium",
              description: `${missingPoCount} of ${rows.length} uploaded records (${Math.round(
                (missingPoCount / rows.length) * 100,
              )}%) have no Purchase Order reference.`,
              affectedField: "po_backed / po_number",
            });
          }

          if (duplicateCount > 0) {
            validationIssues.push({
              id: `val_${Date.now()}_dup`,
              type: "duplicate_records",
              label: "Duplicate Invoice Key Candidates",
              count: duplicateCount,
              severity: "medium",
              description: `${duplicateCount} duplicate vendor + invoice + amount combinations detected in uploaded file.`,
              affectedField: "invoice_id",
            });
          }

          if (missingVendorCount > 0) {
            validationIssues.push({
              id: `val_${Date.now()}_vend`,
              type: "missing_vendor_ids",
              label: "Missing Vendor Identifier",
              count: missingVendorCount,
              severity: "high",
              description: `${missingVendorCount} rows are missing a vendor name or ID.`,
              affectedField: "vendor",
            });
          }

          const hasPoCol = headers.includes("po_backed") || headers.includes("po_number");
          const hasExcCol = headers.includes("exception_flag") || headers.includes("exception");
          const hasOtpCol = headers.includes("paid_on_time") || headers.includes("on_time");

          parsedSummary = {
            totalSpendUsd: totalSpendUsd > 0 ? totalSpendUsd : undefined,
            poBackedPct: hasPoCol
              ? Math.round(((rows.length - missingPoCount) / rows.length) * 100)
              : undefined,
            exceptionPct: hasExcCol
              ? Math.round((exceptionCount / rows.length) * 100)
              : undefined,
            onTimePct: hasOtpCol
              ? Math.round((onTimeCount / rows.length) * 100)
              : undefined,
            avgCycleDays:
              daysCount > 0 ? Number((totalDays / daysCount).toFixed(1)) : undefined,
            duplicateCandidates: duplicateCount,
          };
        }
      } else {
        const lineCount = text.split(/\r?\n/).filter(Boolean).length;
        recordCount = Math.max(1, lineCount);
      }

      const newDs: DataDataset = {
        id: `ds_user_${Date.now()}`,
        datasetType,
        fileName: file.name,
        records: recordCount,
        dataPeriod: dataPeriod || "User Uploaded Extract",
        status: validationIssues.some((v) => v.severity === "high")
          ? "Warnings"
          : "Verified",
        description:
          description ||
          `Uploaded ${datasetType} (${recordCount.toLocaleString()} records analyzed client-side via PapaParse).`,
        isUploadedByUser: true,
        sourceType: "user-uploaded",
        lastUpdated: new Date().toISOString().slice(0, 16).replace("T", " "),
        validationIssues,
        linkedQuestionIds: ["q_vol_01", "q_vol_02", "q_proc_02"],
        linkedKpiIds: ["po_backed_rate", "exception_rate", "on_time_payment_rate"],
        linkedStageIds: ["stage_05", "stage_07", "stage_08"],
        linkedRootCauseIds: ["rc_01", "rc_02"],
        linkedOpportunityIds: ["opp_02", "opp_04"],
        parsedSummary,
      };

      setState((prev) => ({
        ...prev,
        datasets: [newDs, ...prev.datasets],
        lastSavedAt: touchSaved(),
      }));

      pushToast(
        `Analyzed ${file.name}`,
        `Parsed ${recordCount.toLocaleString()} records${
          validationIssues.length > 0
            ? ` and flagged ${validationIssues.length} validation finding(s).`
            : " with 0 validation errors."
        }`,
      );
    },
    [pushToast],
  );

  const removeDataset = useCallback(
    (datasetId: string) => {
      setState((prev) => ({
        ...prev,
        datasets: prev.datasets.filter((d) => d.id !== datasetId),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Dataset removed", "Evidence register updated.", "info");
    },
    [pushToast],
  );

  const updateDatasetLinks = useCallback(
    (
      datasetId: string,
      links: Partial<
        Pick<
          DataDataset,
          "linkedKpiIds" | "linkedStageIds" | "linkedRootCauseIds" | "linkedOpportunityIds"
        >
      >,
    ) => {
      setState((prev) => ({
        ...prev,
        datasets: prev.datasets.map((d) =>
          d.id === datasetId ? { ...d, ...links } : d,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Evidence mapping saved", "Traceability links updated across diagnostic objects.");
    },
    [pushToast],
  );

  // Process Stage actions
  const updateProcessStage = useCallback(
    (stageId: string, patch: Partial<ProcessStageAssessment>) => {
      setState((prev) => ({
        ...prev,
        processStages: prev.processStages.map((s) =>
          s.id === stageId ? { ...s, ...patch } : s,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Process assessment updated", "Maturity heatmap and overall AP maturity score recalculated.");
    },
    [pushToast],
  );

  // Benchmark filter actions
  const updateBenchmarkFilters = useCallback(
    (patch: Partial<BenchmarkFilterState>) => {
      setState((prev) => ({
        ...prev,
        benchmarkFilters: { ...prev.benchmarkFilters, ...patch },
        lastSavedAt: touchSaved(),
      }));
      pushToast("Benchmark cohort updated", "Peer and industry comparison points recalculated.");
    },
    [pushToast],
  );

  // Root Cause actions
  const addRootCause = useCallback(
    (rc: Omit<RootCauseItem, "id" | "code">) => {
      setState((prev) => {
        const nextNum = prev.rootCauses.length + 1;
        const newRc: RootCauseItem = {
          ...rc,
          id: `rc_custom_${Date.now()}`,
          code: `RC-0${nextNum}`,
        };
        return {
          ...prev,
          rootCauses: [...prev.rootCauses, newRc],
          lastSavedAt: touchSaved(),
        };
      });
      pushToast("Root cause added", "Linked into the causal analysis graph and Executive Report.");
    },
    [pushToast],
  );

  const updateRootCause = useCallback(
    (id: string, patch: Partial<RootCauseItem>) => {
      setState((prev) => ({
        ...prev,
        rootCauses: prev.rootCauses.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Root cause updated", "Causal chain and financial impact updated.");
    },
    [pushToast],
  );

  const deleteRootCause = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        rootCauses: prev.rootCauses.filter((r) => r.id !== id),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Root cause removed", undefined, "info");
    },
    [pushToast],
  );

  // Opportunity actions
  const updateOpportunity = useCallback(
    (id: string, patch: Partial<OpportunityItem>) => {
      setState((prev) => ({
        ...prev,
        opportunities: prev.opportunities.map((o) =>
          o.id === id ? { ...o, ...patch } : o,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Opportunity updated", "Prioritization matrix and value portfolio refreshed.");
    },
    [pushToast],
  );

  const toggleOpportunityRoadmap = useCallback(
    (id: string) => {
      setState((prev) => {
        const target = prev.opportunities.find((o) => o.id === id);
        if (!target) return prev;
        const nextInclude = !target.includeInRoadmap;
        const nextStatus: OpportunityItem["status"] = nextInclude
          ? "Selected"
          : "Under Assessment";

        const nextOpps = prev.opportunities.map((o) =>
          o.id === id
            ? { ...o, includeInRoadmap: nextInclude, status: nextStatus }
            : o,
        );

        let nextRoadmap = [...prev.roadmapInitiatives];
        const existingInit = nextRoadmap.find((i) => i.linkedOpportunityId === id);

        if (nextInclude && !existingInit) {
          const wave: RoadmapWave =
            target.priority === "P1 — Immediate"
              ? "Wave 1 — Stabilize & Standardize"
              : target.priority === "P2 — Near-Term"
                ? "Wave 2 — Automate & Optimize"
                : "Wave 3 — Intelligent Finance";

          nextRoadmap.push({
            id: `init_from_${id}`,
            code: `INIT-0${nextRoadmap.length + 1}`,
            name: target.name,
            description: target.proposedSolution,
            processArea: "AP Transformation",
            linkedOpportunityId: id,
            wave,
            businessValueUsd: target.estimatedAnnualBenefitUsd,
            implementationCostUsd: target.estimatedImplementationCostUsd,
            effortWeeks: target.effortWeeks,
            dependencies: target.dependencies,
            owner: "AP Manager & Transformation Lead",
            startDate: wave.startsWith("Wave 1")
              ? "2026-11"
              : wave.startsWith("Wave 2")
                ? "2027-02"
                : "2027-05",
            endDate: wave.startsWith("Wave 1")
              ? "2027-01"
              : wave.startsWith("Wave 2")
                ? "2027-05"
                : "2027-08",
            status: "Planned",
            priority: target.priority.startsWith("P1") ? "Critical" : "High",
            milestones: [
              {
                id: `ms_${Date.now()}`,
                title: `Deploy ${target.code} (${target.targetSuccessMetric})`,
                dueMonth: "2027-03",
                completed: false,
              },
            ],
            successKpi: target.targetSuccessMetric,
          });
        } else if (!nextInclude && existingInit) {
          nextRoadmap = nextRoadmap.filter((i) => i.linkedOpportunityId !== id);
        }

        return {
          ...prev,
          opportunities: nextOpps,
          roadmapInitiatives: nextRoadmap,
          lastSavedAt: touchSaved(),
        };
      });
      pushToast(
        "Roadmap synchronization complete",
        "Transformation Roadmap initiatives updated from Opportunity selection.",
      );
    },
    [pushToast],
  );

  // Value Realization actions
  const updateValueAssumptions = useCallback(
    (patch: Partial<ValueAssumptions>) => {
      setState((prev) => ({
        ...prev,
        valueAssumptions: { ...prev.valueAssumptions, ...patch },
        lastSavedAt: touchSaved(),
      }));
    },
    [],
  );

  const setActiveScenario = useCallback(
    (activeScenario: ValueScenario) => {
      setState((prev) => ({
        ...prev,
        activeScenario,
        lastSavedAt: touchSaved(),
      }));
      pushToast(`Scenario switched to ${activeScenario}`, "Waterfall, payback period, and 3-year cash flows updated.");
    },
    [pushToast],
  );

  // Roadmap actions
  const addRoadmapInitiative = useCallback(
    (init: Omit<RoadmapInitiative, "id" | "code">) => {
      setState((prev) => {
        const newInit: RoadmapInitiative = {
          ...init,
          id: `init_${Date.now()}`,
          code: `INIT-0${prev.roadmapInitiatives.length + 1}`,
        };
        return {
          ...prev,
          roadmapInitiatives: [...prev.roadmapInitiatives, newInit],
          lastSavedAt: touchSaved(),
        };
      });
      pushToast("Roadmap initiative created", "Added to Transformation Roadmap timeline.");
    },
    [pushToast],
  );

  const updateRoadmapInitiative = useCallback(
    (id: string, patch: Partial<RoadmapInitiative>) => {
      setState((prev) => ({
        ...prev,
        roadmapInitiatives: prev.roadmapInitiatives.map((i) =>
          i.id === id ? { ...i, ...patch } : i,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Initiative updated", "Timeline and wave summary refreshed.");
    },
    [pushToast],
  );

  const moveInitiativeWave = useCallback(
    (id: string, wave: RoadmapWave) => {
      setState((prev) => ({
        ...prev,
        roadmapInitiatives: prev.roadmapInitiatives.map((i) =>
          i.id === id ? { ...i, wave } : i,
        ),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Initiative wave updated", `Moved to ${wave}.`);
    },
    [pushToast],
  );

  const toggleInitiativeMilestone = useCallback(
    (initiativeId: string, milestoneId: string) => {
      setState((prev) => ({
        ...prev,
        roadmapInitiatives: prev.roadmapInitiatives.map((init) =>
          init.id === initiativeId
            ? {
                ...init,
                milestones: init.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, completed: !m.completed } : m,
                ),
              }
            : init,
        ),
        lastSavedAt: touchSaved(),
      }));
    },
    [],
  );

  const deleteRoadmapInitiative = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        roadmapInitiatives: prev.roadmapInitiatives.filter((i) => i.id !== id),
        lastSavedAt: touchSaved(),
      }));
      pushToast("Initiative removed from roadmap", undefined, "info");
    },
    [pushToast],
  );

  // Report config actions
  const updateReportConfig = useCallback((patch: Partial<ReportConfigState>) => {
    setState((prev) => ({
      ...prev,
      reportConfig: { ...prev.reportConfig, ...patch },
      lastSavedAt: touchSaved(),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  // Derived metrics & models
  const coreMetrics = useMemo(
    () =>
      deriveCoreMetrics(
        state.questions,
        state.processStages,
        state.valueAssumptions,
      ),
    [state.questions, state.processStages, state.valueAssumptions],
  );

  const kpiBenchmarks = useMemo(
    () =>
      computeAllKpiBenchmarks(
        state.questions,
        state.processStages,
        state.valueAssumptions,
        state.benchmarkFilters,
      ),
    [
      state.questions,
      state.processStages,
      state.valueAssumptions,
      state.benchmarkFilters,
    ],
  );

  const valueSummary = useMemo(
    () => computeValueRealization(state.valueAssumptions, state.activeScenario),
    [state.valueAssumptions, state.activeScenario],
  );

  const sectionCompletion = useMemo(() => {
    const answeredQ = state.questions.filter((q) => q.status === "answered").length;
    const totalQ = state.questions.length;
    const interviewPct = Math.round((answeredQ / totalQ) * 100);

    const verifiedDs = state.datasets.length;
    const dataPct = Math.min(100, Math.round((verifiedDs / 6) * 100));

    const processPct = 100; // All 12 stages assessed
    const benchmarkPct = 100;
    const rootCausePct = state.rootCauses.length >= 4 ? 100 : 75;
    const selectedOpps = state.opportunities.filter(
      (o) => o.status === "Selected",
    ).length;
    const oppPct = selectedOpps >= 6 ? 100 : 80;
    const valuePct = 100;
    const roadmapPct = state.roadmapInitiatives.length >= 4 ? 100 : 75;
    const reportPct = state.visitedSections.includes("report") ? 100 : 85;

    const map: Record<
      StudioSectionId,
      { state: CompletionState; pct: number; detail: string }
    > = {
      overview: {
        state: "completed",
        pct: 100,
        detail: "Executive KPIs & insights active",
      },
      interview: {
        state: interviewPct === 100 ? "completed" : "in-progress",
        pct: interviewPct,
        detail: `${answeredQ}/${totalQ} diagnostic questions answered`,
      },
      data: {
        state: dataPct >= 100 ? "completed" : "in-progress",
        pct: dataPct,
        detail: `${state.datasets.length} datasets validated & mapped`,
      },
      process: {
        state: "completed",
        pct: processPct,
        detail: `12/12 stages assessed (Avg ${coreMetrics.avgMaturity}/5.0)`,
      },
      benchmarks: {
        state: "completed",
        pct: benchmarkPct,
        detail: `11 KPIs benchmarked vs Peer & Best-in-Class`,
      },
      "root-causes": {
        state: rootCausePct === 100 ? "completed" : "in-progress",
        pct: rootCausePct,
        detail: `${state.rootCauses.length} causal chains mapped to KPIs`,
      },
      opportunities: {
        state: oppPct === 100 ? "completed" : "in-progress",
        pct: oppPct,
        detail: `${selectedOpps} of ${state.opportunities.length} opportunities selected`,
      },
      value: {
        state: "completed",
        pct: valuePct,
        detail: `$${(valueSummary.grossAnnualBenefitUsd / 1000).toFixed(0)}k gross annual benefit (${state.activeScenario})`,
      },
      roadmap: {
        state: roadmapPct === 100 ? "completed" : "in-progress",
        pct: roadmapPct,
        detail: `${state.roadmapInitiatives.length} initiatives across 3 waves`,
      },
      report: {
        state: reportPct === 100 ? "completed" : "in-progress",
        pct: reportPct,
        detail: "14-section consulting deliverable ready",
      },
    };
    return map;
  }, [
    state.questions,
    state.datasets.length,
    state.rootCauses.length,
    state.opportunities,
    state.roadmapInitiatives.length,
    state.visitedSections,
    state.activeScenario,
    coreMetrics.avgMaturity,
    valueSummary.grossAnnualBenefitUsd,
  ]);

  const overallCompletionPct = useMemo(() => {
    const vals = Object.values(sectionCompletion).map((s) => s.pct);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [sectionCompletion]);

  const value: StudioContextValue = {
    ...state,
    navigationHistory,
    canGoBack: navigationHistory.length > 0 || drilldown !== null,
    drilldown,
    toasts,
    coreMetrics,
    kpiBenchmarks,
    valueSummary,
    sectionCompletion,
    overallCompletionPct,
    navigateTo,
    goBack,
    openDrilldown,
    closeDrilldown,
    openKpiDrilldown,
    pushToast,
    dismissToast,
    markAllNotificationsRead,
    saveNow,
    setClientName,
    setEngagementStatus,
    resetToHarlowBaseline,
    setActiveInterviewCategory,
    setActiveQuestion,
    updateQuestionAnswer,
    skipQuestion,
    toggleDatasetOnQuestion,
    uploadDatasetFile,
    removeDataset,
    updateDatasetLinks,
    updateProcessStage,
    updateBenchmarkFilters,
    addRootCause,
    updateRootCause,
    deleteRootCause,
    updateOpportunity,
    toggleOpportunityRoadmap,
    updateValueAssumptions,
    setActiveScenario,
    addRoadmapInitiative,
    updateRoadmapInitiative,
    moveInitiativeWave,
    toggleInitiativeMilestone,
    deleteRoadmapInitiative,
    updateReportConfig,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error("useStudio must be used inside <StudioProvider>");
  }
  return ctx;
}
