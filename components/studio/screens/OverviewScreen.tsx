"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowUpRight,
  ShieldAlert,
  TrendingUp,
  Layers,
  MessageSquareText,
  Database,
  Sparkles,
  Clock,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { KpiId, StudioSectionId } from "@/lib/studio/types";

const VOLUME_TREND_DATA = [
  { month: "Apr", poBacked: 7200, nonPo: 4400, touchlessPct: 31 },
  { month: "May", poBacked: 7350, nonPo: 4550, touchlessPct: 32 },
  { month: "Jun", poBacked: 7600, nonPo: 4700, touchlessPct: 33 },
  { month: "Jul", poBacked: 7400, nonPo: 4500, touchlessPct: 34 },
  { month: "Aug", poBacked: 7500, nonPo: 4600, touchlessPct: 34 },
  { month: "Sep", poBacked: 7440, nonPo: 4560, touchlessPct: 34 },
];

const EXCEPTION_DISTRIBUTION_DATA = [
  { name: "Late / Missing GRN", value: 44, count: 11405, color: "#0D1B2E" },
  { name: "Non-PO Coding Hold", value: 31, count: 8035, color: "#EAB308" },
  { name: "Freight / Price Block", value: 25, count: 6480, color: "#0F8B8D" },
];

const CYCLE_PAYMENT_COHORT_DATA = [
  { cohort: "EDI PO", cycleDays: 1.4, onTimePct: 96 },
  { cohort: "Std PO", cycleDays: 2.8, onTimePct: 90 },
  { cohort: "Freight PO", cycleDays: 5.9, onTimePct: 78 },
  { cohort: "Non-PO", cycleDays: 9.8, onTimePct: 63 },
  { cohort: "Peer Avg", cycleDays: 3.8, onTimePct: 88 },
];

export function OverviewScreen() {
  const {
    clientName,
    coreMetrics,
    datasets,
    valueSummary,
    navigateTo,
    setActiveQuestion,
    loadCompletedDemoBaseline,
    openKpiDrilldown,
  } = useStudio();

  const hasAnyInputs = coreMetrics.answeredCount > 0 || datasets.length > 0;
  const isAns = (code: string) =>
    datasets.length > 0 || coreMetrics.answeredFieldCodes.includes(code);

  const kpiCards: Array<{
    id: KpiId;
    label: string;
    unlocked: boolean;
    questionId: string;
    value: string;
    subtext: string;
    status: "critical" | "warning" | "neutral" | "good";
  }> = [
    {
      id: "invoices_per_fte",
      label: "Annual Invoice Volume",
      unlocked: isAns("ap_03"),
      questionId: "q_vol_01",
      value: `${coreMetrics.annualInvoices.toLocaleString()}`,
      subtext: `${coreMetrics.monthlyInvoices.toLocaleString()}/mo · ${(coreMetrics.invoicesPerFte / 1000).toFixed(1)}k/FTE vs 36k Peer`,
      status: "neutral",
    },
    {
      id: "po_backed_rate",
      label: "PO-Backed Invoice Rate",
      unlocked: isAns("ap_04"),
      questionId: "q_vol_02",
      value: `${coreMetrics.poBackedRate}%`,
      subtext: `Peer: 85% · ${100 - coreMetrics.poBackedRate}% Non-PO volume`,
      status: coreMetrics.poBackedRate < 75 ? "critical" : "good",
    },
    {
      id: "touchless_rate",
      label: "Touchless Processing Rate",
      unlocked: isAns("ap_touchless"),
      questionId: "q_tech_02",
      value: `${coreMetrics.touchlessRate}%`,
      subtext: `Peer: 65% · Best-in-Class: 88%`,
      status: coreMetrics.touchlessRate < 50 ? "critical" : "warning",
    },
    {
      id: "exception_rate",
      label: "Invoice Exception Rate",
      unlocked: isAns("ap_08"),
      questionId: "q_proc_02",
      value: `${coreMetrics.exceptionRate}%`,
      subtext: `Peer: 8% · ${Math.round(coreMetrics.annualInvoices * (coreMetrics.exceptionRate / 100)).toLocaleString()} reworks/yr`,
      status: coreMetrics.exceptionRate > 12 ? "critical" : "good",
    },
    {
      id: "cost_per_invoice",
      label: "Unit Cost per Invoice",
      unlocked: isAns("ap_19") || isAns("ap_03"),
      questionId: "q_wf_01",
      value: `$${coreMetrics.costPerInvoice.toFixed(2)}`,
      subtext: `Peer: $5.20 · Best-in-Class: $2.40`,
      status: coreMetrics.costPerInvoice > 8 ? "critical" : "warning",
    },
    {
      id: "cycle_time_days",
      label: "Avg Processing Cycle Time",
      unlocked: isAns("ap_09"),
      questionId: "q_kpi_01",
      value: `${coreMetrics.cycleTimeDays.toFixed(1)} days`,
      subtext: `PO: 2.4d · Non-PO: 9.8d · Peer: 3.8d`,
      status: coreMetrics.cycleTimeDays > 5 ? "warning" : "good",
    },
    {
      id: "discount_capture_rate",
      label: "Discount Capture Rate",
      unlocked: isAns("ap_14"),
      questionId: "q_kpi_04",
      value: `${coreMetrics.discountCaptureRate}%`,
      subtext: `Peer: 68% · $173.6k/yr forfeited in queues`,
      status: coreMetrics.discountCaptureRate < 55 ? "critical" : "good",
    },
    {
      id: "vendor_query_rate",
      label: "Vendor Inquiry Load",
      unlocked: isAns("ap_17"),
      questionId: "q_wf_02",
      value: `${coreMetrics.monthlyQueries.toLocaleString()}/mo`,
      subtext: `${coreMetrics.vendorQueryRatePer1k}/1k inv vs 35 Peer · 1.5 FTEs`,
      status: coreMetrics.vendorQueryRatePer1k > 50 ? "warning" : "good",
    },
  ];

  const diagnosticFindings = [
    {
      id: "ins_1",
      severity: "Critical",
      title: "Invoice exceptions are 2.25× the peer benchmark",
      kpiId: "exception_rate" as KpiId,
      metric: `${coreMetrics.exceptionRate}% vs. 8.0% Peer`,
      implication:
        "25,920 invoices/yr require manual rework (~3.0 FTEs), driven by late plant GRNs (44%) and rigid $25 SAP freight tolerances (25%).",
      action:
        "Recalibrate SAP freight tolerance ($25 → $100 / 2%) & enforce 24-hr dock GRN SLA (OPP-04, OPP-05).",
      impact: "$210k/yr Savings",
      wave: "Wave 1 (Wks 1–8)",
      targetSection: "root-causes" as StudioSectionId,
      sectionLabel: "Root Causes",
    },
    {
      id: "ins_2",
      severity: "Critical",
      title: "38% Non-PO invoice volume caps touchless automation",
      kpiId: "po_backed_rate" as KpiId,
      metric: `${coreMetrics.poBackedRate}% vs. 85% Peer`,
      implication:
        "54,720 indirect invoices/yr bypass 3-way matching and take 9.8 days to code and approve versus 2.4 days for PO-backed invoices.",
      action:
        "Publish joint Procurement–Finance No-PO-No-Pay policy & deploy AI/IDP line-level extraction (OPP-02, OPP-04).",
      impact: "$244k/yr Value",
      wave: "Wave 1–2",
      targetSection: "benchmarks" as StudioSectionId,
      sectionLabel: "Benchmarks",
    },
    {
      id: "ins_3",
      severity: "Critical",
      title: "Vendor master SoD & bank-change controls expose payment risk",
      kpiId: "automation_maturity" as KpiId,
      metric: "Level 1 · 26 Dup IBANs",
      implication:
        "3 AP processors hold unsegregated SAP XK01/XK02 rights alongside invoice posting; email bank changes lack logged voice callbacks.",
      action:
        "Segregate vendor maintenance, activate SAP FK08 dual control & pre-F110 duplicate blocker (OPP-08, OPP-09).",
      impact: "$65k/yr + Control",
      wave: "Wave 1 (Wks 1–4)",
      targetSection: "process" as StudioSectionId,
      sectionLabel: "Process",
    },
    {
      id: "ins_4",
      severity: "High",
      title: "Early-payment discount capture forfeits $173.6k annually",
      kpiId: "discount_capture_rate" as KpiId,
      metric: `${coreMetrics.discountCaptureRate}% vs. 68% Peer`,
      implication:
        "62% of eligible 2/10 Net 30 discounts ($14M spend) expire while awaiting sequential plant controller sign-off.",
      action:
        "Enable 48-hr approval escalation, substitute delegation & 2/10 Net 30 fast-track queue (OPP-06, OPP-10).",
      impact: "$132k/yr Cash",
      wave: "Wave 1 (Wks 3–8)",
      targetSection: "value" as StudioSectionId,
      sectionLabel: "Value Engine",
    },
    {
      id: "ins_5",
      severity: "Medium",
      title: "900 monthly vendor inquiries consume 1.5 FTEs of capacity",
      kpiId: "vendor_query_rate" as KpiId,
      metric: `${coreMetrics.vendorQueryRatePer1k}/1k vs. 35 Peer`,
      implication:
        "Lack of self-service payment status visibility and 47 unstandardized payment terms drive 10,800 vendor calls/emails per year.",
      action:
        "Rationalize 47 payment terms into 6 bands & launch Supplier Self-Service Portal (OPP-07, OPP-11).",
      impact: "$156k/yr + $750k WC",
      wave: "Wave 3 (Mos 5–8)",
      targetSection: "roadmap" as StudioSectionId,
      sectionLabel: "Roadmap",
    },
  ];

  return (
    <div className="space-y-5">
      {/* LIVE DIAGNOSTIC LAUNCHPAD BANNER WHEN INTAKE IS INCOMPLETE */}
      {coreMetrics.answeredCount < coreMetrics.totalQuestions && (
        <div className="rounded-xl border-2 border-[#FFE600] bg-amber-50/90 p-4 text-slate-900 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#0D1B2E] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#FFE600] uppercase">
                  {hasAnyInputs ? "Diagnostic Intake In Progress" : "Step 1 · Ready for Live CFO Demo"}
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {coreMetrics.answeredCount}/{coreMetrics.totalQuestions} Interview Questions Answered · {datasets.length}/4 SAP Extracts Ingested
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700">
                {hasAnyInputs
                  ? "KPIs below are updating live from your captured interview responses. Continue the interview or ingest the SAP extracts to unlock the full diagnostic."
                  : "Start the live CFO Diagnostic Interview to capture client baselines question-by-question, or click Auto-Load Full Demo if you wish to jump directly to the completed executive state."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo("interview")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D1B2E] px-4 py-2 text-xs font-extrabold text-[#FFE600] shadow-xs hover:bg-slate-800"
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                <span>
                  {coreMetrics.answeredCount === 0
                    ? "Start Live CFO Interview (0/12) →"
                    : `Resume Interview (${coreMetrics.answeredCount}/${coreMetrics.totalQuestions}) →`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("data")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                <Database className="h-3.5 w-3.5" />
                <span>Ingest SAP Extracts ({datasets.length}/4)</span>
              </button>

              <button
                type="button"
                onClick={loadCompletedDemoBaseline}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-amber-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto-Load Full Demo (100%)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. COMPACT EXECUTIVE SCOPE & VALUE COMMAND STRIP */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1B2E] px-5 py-4 text-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
              <Layers className="h-3.5 w-3.5 text-[#FFE600]" />
              <span className="font-bold text-white">{clientName}</span>
              <span className="text-slate-500">·</span>
              <span>Industrial Manufacturing</span>
              <span className="text-slate-500">·</span>
              <span>SAP ECC 6.0 (4 Plants)</span>
            </div>
            <p className="text-xs text-slate-400">
              Baseline Scope:{" "}
              <strong className="font-mono text-slate-200">$68.4M</strong> Annual AP Spend ·{" "}
              <strong className="font-mono text-slate-200">
                {hasAnyInputs ? coreMetrics.annualInvoices.toLocaleString() : "Awaiting Intake"}
              </strong>{" "}
              Invoices/yr ·{" "}
              <strong className="font-mono text-slate-200">
                {hasAnyInputs ? coreMetrics.ftes : "—"}
              </strong>{" "}
              AP FTEs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 tabular-nums">
            <button
              type="button"
              onClick={() => navigateTo(hasAnyInputs ? "value" : "interview")}
              className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-left transition-colors hover:border-slate-500"
            >
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Gross Value ({valueSummary.scenario})
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-[#FFE600]">
                {hasAnyInputs
                  ? `$${(valueSummary.grossAnnualBenefitUsd / 1000).toFixed(0)}k/yr`
                  : "Pending Input"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(hasAnyInputs ? "value" : "interview")}
              className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-left transition-colors hover:border-slate-500"
            >
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Net Run-Rate
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-emerald-400">
                {hasAnyInputs
                  ? `$${(valueSummary.netAnnualBenefitUsd / 1000).toFixed(0)}k/yr`
                  : "Pending Input"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(hasAnyInputs ? "value" : "interview")}
              className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-left transition-colors hover:border-slate-500"
            >
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                1-Time Cash Release
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-sky-300">
                {hasAnyInputs
                  ? `$${(valueSummary.oneTimeWorkingCapitalReleaseUsd / 1000).toFixed(0)}k`
                  : "Pending Input"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(hasAnyInputs ? "roadmap" : "interview")}
              className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-left transition-colors hover:border-slate-500"
            >
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Payback &amp; 3Y ROI
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-white">
                {hasAnyInputs ? (
                  <>
                    {valueSummary.paybackMonths}m{" "}
                    <span className="text-xs font-bold text-emerald-400">
                      ({valueSummary.roiPct}%)
                    </span>
                  </>
                ) : (
                  "Pending Input"
                )}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 8 CORE OPERATIONAL KPI CARDS (4x2 Enterprise Grid) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          if (!card.unlocked) {
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => {
                  setActiveQuestion(card.questionId);
                  navigateTo("interview");
                }}
                className="group flex flex-col justify-between rounded-xl border border-dashed border-slate-300 bg-white/80 p-4 text-left transition-all hover:border-slate-900 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {card.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    <Clock className="h-2.5 w-2.5" />
                    Awaiting Input
                  </span>
                </div>
                <p className="mt-2 font-mono text-lg font-bold text-slate-400">
                  — / Pending
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 group-hover:text-slate-950">
                  Click to capture in Interview →
                </p>
              </button>
            );
          }

          const borderAccent =
            card.status === "critical"
              ? "border-t-2 border-t-red-500"
              : card.status === "warning"
                ? "border-t-2 border-t-amber-500"
                : card.status === "good"
                  ? "border-t-2 border-t-emerald-500"
                  : "border-t-2 border-t-slate-400";

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => openKpiDrilldown(card.id)}
              className={`group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition-all hover:border-slate-900 hover:shadow-md ${borderAccent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {card.label}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    card.status === "critical"
                      ? "bg-red-50 text-red-700"
                      : card.status === "warning"
                        ? "bg-amber-50 text-amber-800"
                        : card.status === "good"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {card.status === "critical"
                    ? "Gap"
                    : card.status === "warning"
                      ? "Watch"
                      : "Baseline"}
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{card.subtext}</p>
            </button>
          );
        })}
      </div>

      {/* 3. UNIFIED 3-CHART OPERATIONAL TELEMETRY STRIP */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Chart 1: Monthly Volume Split (5 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:col-span-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
                Monthly Volume Split (PO vs. Non-PO)
              </h2>
              <p className="text-[11px] text-slate-500">
                38% Non-PO volume (~4,560/mo) caps touchless rate at 34%
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("benchmarks")}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-950"
            >
              Benchmarks →
            </button>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={VOLUME_TREND_DATA}
                margin={{ top: 6, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="poBacked"
                  name="PO-Backed (62%)"
                  stackId="a"
                  fill="#0D1B2E"
                />
                <Bar
                  dataKey="nonPo"
                  name="Non-PO (38%)"
                  stackId="a"
                  fill="#EAB308"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Exception Distribution (3 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:col-span-3">
          <div>
            <h2 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              Exception Drivers (25.9k/yr)
            </h2>
            <p className="text-[11px] text-slate-500">
              Share of manual invoice blocks
            </p>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EXCEPTION_DISTRIBUTION_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={56}
                  paddingAngle={3}
                >
                  {EXCEPTION_DISTRIBUTION_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-[11px]">
            {EXCEPTION_DISTRIBUTION_DATA.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 truncate">
                  <span
                    className="h-2 w-2 shrink-0 rounded-xs"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Cycle Time & Payment by Cohort (4 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:col-span-4">
          <div>
            <h2 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              Cycle Time &amp; On-Time Pay by Cohort
            </h2>
            <p className="text-[11px] text-slate-500">
              Non-PO delay (9.8d) drives late payment &amp; missed discounts
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={CYCLE_PAYMENT_COHORT_DATA}
                margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cycleDays"
                  name="Cycle (Days)"
                  stroke="#0D1B2E"
                  strokeWidth={2.2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTimePct"
                  name="On-Time (%)"
                  stroke="#0F8B8D"
                  strokeWidth={2.2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. CONSOLIDATED EXECUTIVE DIAGNOSTIC FINDINGS & ACTION REGISTER */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Executive Diagnostic Findings &amp; Priority Transformation Levers
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo("roadmap")}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-100"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Open 3-Wave Roadmap →</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase">
                <th className="px-3 py-2.5 font-bold">Diagnostic Finding &amp; Implication</th>
                <th className="px-3 py-2.5 font-bold">Observed KPI Gap</th>
                <th className="px-3 py-2.5 font-bold">Recommended Transformation Lever</th>
                <th className="px-3 py-2.5 font-bold">Annual Impact</th>
                <th className="px-3 py-2.5 text-right font-bold">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {diagnosticFindings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="max-w-md px-3 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          item.severity === "Critical"
                            ? "bg-red-100 text-red-800"
                            : item.severity === "High"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="font-bold text-slate-900">{item.title}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      {item.implication}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openKpiDrilldown(item.kpiId)}
                      className="font-mono text-xs font-bold text-slate-900 underline decoration-[#FFE600] decoration-2 hover:text-slate-700"
                    >
                      {item.metric}
                    </button>
                  </td>
                  <td className="max-w-sm px-3 py-3 align-top text-slate-700">
                    {item.action}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <span className="block font-mono font-bold text-emerald-700 tabular-nums">
                      {item.impact}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.wave}</span>
                  </td>
                  <td className="px-3 py-3 text-right align-top whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigateTo(item.targetSection)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-slate-900"
                    >
                      <span>{item.sectionLabel}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
