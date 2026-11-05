"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  Database,
  GitMerge,
  BarChart3,
  GitBranch,
  Sparkles,
  DollarSign,
  CalendarRange,
  FileText,
  Bell,
  Search,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Download,
  Save,
  X,
  Building2,
  Pencil,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { StudioSectionId } from "@/lib/studio/types";
import { DrilldownDrawer } from "./DrilldownDrawer";
import { exportStudioExecutivePdf } from "@/lib/studio/export-studio-pdf";

export const STUDIO_NAV_ITEMS: Array<{
  id: StudioSectionId;
  number: string;
  label: string;
  shortTitle: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  nextSection?: StudioSectionId;
  nextLabel?: string;
}> = [
  {
    id: "overview",
    number: "01",
    label: "Overview",
    shortTitle: "Executive Overview",
    subtitle: "Baseline operational KPIs, telemetry trends, and prioritized transformation findings.",
    icon: LayoutDashboard,
    nextSection: "interview",
    nextLabel: "Diagnostic Interview",
  },
  {
    id: "interview",
    number: "02",
    label: "Diagnostic Interview",
    shortTitle: "Diagnostic Interview",
    subtitle: "8-category structured question bank with live KPI extraction and contradiction checks.",
    icon: MessageSquareText,
    nextSection: "data",
    nextLabel: "Data & Evidence",
  },
  {
    id: "data",
    number: "03",
    label: "Data & Evidence",
    shortTitle: "Data & Evidence",
    subtitle: "Finance dataset intake, automated schema audit, and evidence-to-finding traceability.",
    icon: Database,
    nextSection: "process",
    nextLabel: "Process Assessment",
  },
  {
    id: "process",
    number: "04",
    label: "Process Assessment",
    shortTitle: "Process Assessment",
    subtitle: "12-stage AP value chain maturity, control effectiveness, and operational pain points.",
    icon: GitMerge,
    nextSection: "benchmarks",
    nextLabel: "Benchmark Analysis",
  },
  {
    id: "benchmarks",
    number: "05",
    label: "Benchmark Analysis",
    shortTitle: "Benchmark Analysis",
    subtitle: "11 core AP KPIs benchmarked against Industry, Peer, and Best-in-Class cohorts.",
    icon: BarChart3,
    nextSection: "root-causes",
    nextLabel: "Root Cause Analysis",
  },
  {
    id: "root-causes",
    number: "06",
    label: "Root Cause Analysis",
    shortTitle: "Root Cause Analysis",
    subtitle: "End-to-end causal chains linking KPI gaps to process, policy, and system drivers.",
    icon: GitBranch,
    nextSection: "opportunities",
    nextLabel: "Automation & AI Levers",
  },
  {
    id: "opportunities",
    number: "07",
    label: "Automation & AI",
    shortTitle: "Automation & AI Portfolio",
    subtitle: "12 transformation levers prioritized by business value and implementation complexity.",
    icon: Sparkles,
    nextSection: "value",
    nextLabel: "Value Realization",
  },
  {
    id: "value",
    number: "08",
    label: "Value Realization",
    shortTitle: "Value Realization Engine",
    subtitle: "Non-double-counted CFO economic model across 8 benefit levers and 3 scenarios.",
    icon: DollarSign,
    nextSection: "roadmap",
    nextLabel: "Transformation Roadmap",
  },
  {
    id: "roadmap",
    number: "09",
    label: "Roadmap",
    shortTitle: "Transformation Roadmap",
    subtitle: "3-wave phased execution plan across Stabilize, Automate, and Intelligent Finance.",
    icon: CalendarRange,
    nextSection: "report",
    nextLabel: "Executive Report",
  },
  {
    id: "report",
    number: "10",
    label: "Executive Report",
    shortTitle: "Executive Report Studio",
    subtitle: "14-section board deliverable with live narrative editing and branded PDF export.",
    icon: FileText,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    clientName,
    engagementName,
    activeSection,
    sectionCompletion,
    overallCompletionPct,
    lastSavedAt,
    notifications,
    canGoBack,
    toasts,
    kpiBenchmarks,
    rootCauses,
    opportunities,
    datasets,
    processStages,
    reportConfig,
    coreMetrics,
    valueSummary,
    roadmapInitiatives,
    navigateTo,
    goBack,
    openKpiDrilldown,
    openDrilldown,
    dismissToast,
    markAllNotificationsRead,
    saveNow,
    setClientName,
    resetToHarlowBaseline,
    loadCompletedDemoBaseline,
  } = useStudio();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clientEditOpen, setClientEditOpen] = useState(false);
  const [clientDraft, setClientDraft] = useState(clientName);
  const [exportingPdf, setExportingPdf] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeSection]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentNav =
    STUDIO_NAV_ITEMS.find((i) => i.id === activeSection) ?? STUDIO_NAV_ITEMS[0];

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const items: Array<{
      id: string;
      category: string;
      title: string;
      subtitle: string;
      onSelect: () => void;
    }> = [];

    STUDIO_NAV_ITEMS.forEach((sec) => {
      if (
        sec.label.toLowerCase().includes(q) ||
        sec.subtitle.toLowerCase().includes(q)
      ) {
        items.push({
          id: `sec_${sec.id}`,
          category: "Screen",
          title: `${sec.number}. ${sec.label}`,
          subtitle: sec.subtitle,
          onSelect: () => navigateTo(sec.id),
        });
      }
    });

    kpiBenchmarks.forEach((k) => {
      if (
        k.name.toLowerCase().includes(q) ||
        k.businessInterpretation.toLowerCase().includes(q)
      ) {
        items.push({
          id: `kpi_${k.id}`,
          category: "KPI Benchmark",
          title: `${k.name} (${k.formattedClient})`,
          subtitle: `Peer: ${k.peerBenchmark} ${k.unit} · ${k.classification}`,
          onSelect: () => openKpiDrilldown(k.id),
        });
      }
    });

    rootCauses.forEach((r) => {
      if (
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.rootCauseStatement.toLowerCase().includes(q)
      ) {
        items.push({
          id: `rc_${r.id}`,
          category: "Root Cause",
          title: `${r.code}: ${r.title}`,
          subtitle: `${r.category} · $${(r.estimatedAnnualImpactUsd / 1000).toFixed(0)}k/yr impact`,
          onSelect: () => navigateTo("root-causes"),
        });
      }
    });

    opportunities.forEach((o) => {
      if (
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
      ) {
        items.push({
          id: `opp_${o.id}`,
          category: "Opportunity",
          title: `${o.code}: ${o.name}`,
          subtitle: `${o.automationType} · +$${(o.estimatedAnnualBenefitUsd / 1000).toFixed(0)}k/yr`,
          onSelect: () => openDrilldown({ type: "opportunity", opportunityId: o.id }),
        });
      }
    });

    return items.slice(0, 8);
  }, [
    searchQuery,
    kpiBenchmarks,
    rootCauses,
    opportunities,
    navigateTo,
    openKpiDrilldown,
    openDrilldown,
  ]);

  async function handleExportExecutivePdf() {
    setExportingPdf(true);
    try {
      await exportStudioExecutivePdf({
        clientName,
        engagementName,
        reportConfig,
        coreMetrics,
        kpiBenchmarks,
        processStages,
        rootCauses,
        opportunities,
        valueSummary,
        roadmapInitiatives,
        datasets,
      });
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="print-unfreeze flex h-screen w-full flex-col overflow-hidden bg-[#F1F5F9] text-slate-900">
      {/* 1. FROZEN GLOBAL APPLICATION HEADER */}
      <header className="no-print z-40 h-14 shrink-0 border-b border-slate-800/90 bg-[#0B1424] text-white">
        <div className="flex h-full w-full items-center justify-between gap-4 px-5">
          {/* Left: Brand & Active Client Engagement */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigateTo("overview")}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFE600] text-xs font-black tracking-tighter text-slate-950">
                EY
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  AP Diagnostic Studio
                </span>
              </div>
            </button>

            <div className="h-5 w-px bg-slate-800" />

            {/* Active Client & Engagement Stage */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setClientDraft(clientName);
                  setClientEditOpen(true);
                }}
                className="group flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs transition-colors hover:border-slate-600"
                title="Edit client organization name"
              >
                <Building2 className="h-3.5 w-3.5 text-[#FFE600]" />
                <span className="font-semibold text-slate-100">{clientName}</span>
                <Pencil className="h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-300" />
              </button>

              <span
                className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold xl:inline-flex ${
                  overallCompletionPct === 100
                    ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-300"
                    : overallCompletionPct > 0
                      ? "border-amber-400/40 bg-amber-950/40 text-[#FFE600]"
                      : "border-slate-800 bg-slate-900/90 text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    overallCompletionPct === 100
                      ? "bg-emerald-400"
                      : overallCompletionPct > 0
                        ? "bg-[#FFE600]"
                        : "bg-slate-500"
                  }`}
                />
                <span>
                  {overallCompletionPct === 100
                    ? "Executive Sign-Off Ready"
                    : overallCompletionPct > 0
                      ? `Live Diagnostic (${overallCompletionPct}%)`
                      : "Awaiting Discovery Inputs"}
                </span>
              </span>
            </div>
          </div>

          {/* Center: Global Command Search */}
          <div className="relative hidden max-w-xs flex-1 md:block lg:max-w-md">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search KPIs, root causes, opportunities, screens…"
                className="w-full rounded-md border border-slate-800 bg-slate-900/90 py-1.5 pr-8 pl-8 text-xs text-white placeholder:text-slate-500 focus:border-[#FFE600] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchOpen && searchQuery.trim() && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSearchOpen(false)}
                />
                <div className="absolute right-0 left-0 z-20 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl">
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500">
                      No matching KPIs, opportunities, or root causes found.
                    </p>
                  ) : (
                    searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          res.onSelect();
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {res.title}
                          </span>
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {res.category}
                          </span>
                        </div>
                        <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {res.subtitle}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Save, Notifications, Reset, Export PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveNow}
              className="hidden items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white sm:inline-flex"
              title="Save diagnostic state now"
            >
              <Save className="h-3.5 w-3.5 text-emerald-400" />
              <span className="tabular-nums">Saved {lastSavedAt}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-md border border-slate-800 bg-slate-900/80 p-1.5 text-slate-300 hover:border-slate-600 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFE600] text-[10px] font-extrabold text-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Diagnostic Alerts
                      </span>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (n.targetSection) navigateTo(n.targetSection);
                            setNotifOpen(false);
                          }}
                          className={`w-full rounded-lg p-2.5 text-left transition-colors hover:bg-slate-100 ${
                            n.read ? "bg-white" : "bg-amber-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-snug text-slate-600">
                            {n.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reset Session */}
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-[#FFE600] hover:text-white"
              title="Reset interview answers and datasets"
              aria-label="Reset diagnostic session"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#FFE600]" />
              <span>Reset</span>
            </button>

            {/* Primary Export PDF CTA */}
            <button
              type="button"
              onClick={handleExportExecutivePdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#FFE600] px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportingPdf ? "Exporting…" : "Export PDF"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY: FROZEN NON-COLLAPSIBLE SIDEBAR + INDEPENDENTLY SCROLLABLE WORKSPACE */}
      <div className="print-unfreeze flex min-h-0 flex-1 overflow-hidden">
        {/* Permanently Frozen Left Sidebar (Non-Collapsible) */}
        <aside
          aria-label="Studio Navigation Sidebar"
          className="no-print z-30 flex h-full w-64 shrink-0 flex-col border-r border-slate-800/90 bg-[#0D1B2E] text-slate-200 select-none"
        >
          {/* Overall Completion Progress Header */}
          <div className="shrink-0 border-b border-slate-800/90 px-4 py-3.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold tracking-wider text-slate-400 uppercase">
                Diagnostic Readiness
              </span>
              <span className="font-mono font-bold text-[#FFE600] tabular-nums">
                {overallCompletionPct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-[#FFE600] transition-all duration-300"
                style={{ width: `${overallCompletionPct}%` }}
              />
            </div>
          </div>

          {/* 10 Frozen Navigation Modules */}
          <nav
            className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2.5"
            aria-label="Diagnostic Studio Sections"
          >
            {STUDIO_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const comp = sectionCompletion[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all ${
                    isActive
                      ? "bg-white/[0.09] font-bold text-white shadow-xs"
                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-[#FFE600]"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? "text-[#FFE600]"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <div className="truncate">
                      <span className="mr-1.5 font-mono text-[10px] text-slate-500">
                        {item.number}
                      </span>
                      <span className="text-[12.5px]">{item.label}</span>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <span className="ml-2 shrink-0">
                    {comp?.state === "completed" ? (
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          isActive ? "text-[#FFE600]" : "text-emerald-400/90"
                        }`}
                      />
                    ) : (
                      <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 tabular-nums">
                        {comp?.pct}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Pinned Bottom Value Case Telemetry */}
          <div className="shrink-0 border-t border-slate-800/90 bg-[#091322] px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-400">
                Value Case ({valueSummary.scenario})
              </span>
              <span className="font-mono text-xs font-extrabold text-[#FFE600] tabular-nums">
                {coreMetrics.answeredCount > 0 || datasets.length > 0
                  ? `$${Math.round(
                      (valueSummary.grossAnnualBenefitUsd *
                        Math.max(
                          0.15,
                          coreMetrics.answeredCount /
                            Math.max(1, coreMetrics.totalQuestions),
                        )) /
                        1000,
                    )}k/yr`
                  : "$0k/yr"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400 tabular-nums">
              <span>
                {coreMetrics.answeredCount > 0 || datasets.length > 0
                  ? `Payback: ${valueSummary.paybackMonths}m`
                  : "Awaiting Inputs"}
              </span>
              <span className="text-emerald-400">
                {coreMetrics.answeredCount > 0 || datasets.length > 0
                  ? `3Y ROI: ${valueSummary.roiPct}%`
                  : `${coreMetrics.answeredCount}/${coreMetrics.totalQuestions} Qs`}
              </span>
            </div>
          </div>
        </aside>

        {/* Independently Scrollable Right Workspace */}
        <div
          ref={mainScrollRef}
          className="print-unfreeze flex min-w-0 flex-1 flex-col overflow-y-auto"
        >
          {/* Sticky Module Context Bar */}
          <div className="no-print sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 px-6 py-2.5 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {(canGoBack || activeSection !== "overview") && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                    title="Return to previous screen"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="rounded bg-[#0D1B2E] px-2 py-0.5 font-mono text-[11px] font-bold text-[#FFE600]">
                    {currentNav.number}
                  </span>
                  <h1 className="truncate text-sm font-extrabold text-slate-900">
                    {currentNav.shortTitle}
                  </h1>
                  <span className="hidden text-slate-300 lg:inline">·</span>
                  <p className="hidden truncate text-xs text-slate-500 lg:block">
                    {currentNav.subtitle}
                  </p>
                </div>
              </div>

              {/* Contextual Next Step CTA */}
              <div className="flex items-center gap-3">
                <span className="hidden rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 xl:inline">
                  {sectionCompletion[activeSection]?.detail}
                </span>
                {currentNav.nextSection && (
                  <button
                    type="button"
                    onClick={() => navigateTo(currentNav.nextSection!)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#0D1B2E] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    <span>Next: {currentNav.nextLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#FFE600]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Screen Body */}
          <main className="mx-auto w-full max-w-[1480px] flex-1 px-6 py-5">
            {children}
          </main>
        </div>
      </div>

      {/* Universal Drilldown Drawer */}
      <DrilldownDrawer />

      {/* Toast Notification Stack */}
      {toasts.length > 0 && (
        <div className="no-print fixed right-5 bottom-5 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="animate-message-in flex w-88 items-start justify-between gap-3 rounded-xl border border-slate-700 bg-[#0D1B2E] p-3.5 text-white shadow-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FFE600]" />
                  <p className="text-xs font-bold text-white">{t.title}</p>
                </div>
                {t.description && (
                  <p className="mt-1 text-xs leading-snug text-slate-300">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Client Name Edit Modal */}
      {clientEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Update Client Engagement Name
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Updates the client organization across all 10 screens, benchmarks, and the Executive Report cover page.
            </p>
            <input
              type="text"
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClientEditOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (clientDraft.trim()) setClientName(clientDraft.trim());
                  setClientEditOpen(false);
                }}
                className="rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-90"
              >
                Save Client Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Session Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Reset Diagnostic Answers &amp; Session?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Choose how you would like to reset the{" "}
              <strong>{clientName}</strong> diagnostic session:
            </p>
            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                <strong className="text-slate-900">1. Reset All Answers &amp; Data (0% Clean Slate):</strong>{" "}
                Clears all 12 interview responses and removes ingested SAP datasets so you can walk the CFO through the live question-by-question demo from scratch.
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">2. Auto-Load Completed Demo (100%):</strong>{" "}
                Populates all 12 Harlow Industrial Components answers and 4 SAP extracts immediately.
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  loadCompletedDemoBaseline();
                  setResetModalOpen(false);
                }}
                className="rounded-lg border border-slate-900 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
              >
                Load Completed Demo (100%)
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToHarlowBaseline();
                  setResetModalOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700"
              >
                Reset All Answers (0% Clean Slate)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
