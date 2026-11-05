"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Download,
  Printer,
  Palette,
  Edit3,
  ShieldAlert,
  FileDown,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { ReportConfigState } from "@/lib/studio/types";
import { exportStudioExecutivePdf } from "@/lib/studio/export-studio-pdf";
import { DiagnosticGate } from "../DiagnosticGate";

const REPORT_SECTIONS = [
  { id: "sec_01", num: "01", title: "Cover Page" },
  { id: "sec_02", num: "02", title: "Executive Summary" },
  { id: "sec_03", num: "03", title: "Client Overview" },
  { id: "sec_04", num: "04", title: "AP Current-State Performance" },
  { id: "sec_05", num: "05", title: "Diagnostic Findings" },
  { id: "sec_06", num: "06", title: "Benchmark Analysis" },
  { id: "sec_07", num: "07", title: "Root Cause Analysis" },
  { id: "sec_08", num: "08", title: "Automation & AI Opportunities" },
  { id: "sec_09", num: "09", title: "Value Realization" },
  { id: "sec_10", num: "10", title: "Transformation Roadmap" },
  { id: "sec_11", num: "11", title: "Risks & Dependencies" },
  { id: "sec_12", num: "12", title: "Recommended Next Steps" },
  { id: "sec_13", num: "13", title: "Appendix — Evidence Register" },
  { id: "sec_14", num: "14", title: "Data Sources & Assumptions" },
];

export function ReportStudioScreen() {
  const {
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
    updateReportConfig,
    pushToast,
  } = useStudio();

  const [activeSectionId, setActiveSectionId] = useState("sec_01");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [cfoCritique, setCfoCritique] = useState<string | null>(null);
  const [runningCritique, setRunningCritique] = useState(false);

  if (coreMetrics.answeredCount === 0 && datasets.length === 0) {
    return (
      <DiagnosticGate
        screenTitle="14-Section Executive Consulting Report"
        description="The board deliverable cannot be compiled until diagnostic interview responses or SAP transaction extracts have been captured. Complete the Diagnostic Interview or load the SAP extracts to generate the report."
      />
    );
  }

  const scrollToReportSection = (secId: string) => {
    setActiveSectionId(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExportPdf = async () => {
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
      pushToast("Executive PDF exported", "14-section consulting report downloaded.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = `# ${reportConfig.reportTitle}
**Client:** ${clientName}
**Subtitle:** ${reportConfig.subtitle}
**Prepared For:** ${reportConfig.preparedFor}
**Prepared By:** ${reportConfig.preparedBy}

---

## 2. Executive Summary
${reportConfig.executiveSummaryText}

## 3. Client Overview
${reportConfig.clientOverviewText}

## 4. AP Current-State Performance
- Monthly Invoices: ${coreMetrics.monthlyInvoices.toLocaleString()} (${coreMetrics.annualInvoices.toLocaleString()}/yr)
- PO-Backed Rate: ${coreMetrics.poBackedRate}%
- Touchless Processing Rate: ${coreMetrics.touchlessRate}%
- Exception Rate: ${coreMetrics.exceptionRate}%
- Processing Cycle Time: ${coreMetrics.cycleTimeDays.toFixed(1)} days
- On-Time Payment Rate: ${coreMetrics.onTimePaymentRate}%
- Early-Payment Discount Capture: ${coreMetrics.discountCaptureRate}%
- Gross Annual Value Case (${valueSummary.scenario}): $${valueSummary.grossAnnualBenefitUsd.toLocaleString()}/yr

## 7. Root Causes
${rootCauses.map((r) => `- **${r.code} (${r.category}) — ${r.title}:** ${r.rootCauseStatement} (Impact: $${r.estimatedAnnualImpactUsd.toLocaleString()}/yr)`).join("\n")}

## 8. Selected Transformation Opportunities
${opportunities.filter((o) => o.status === "Selected").map((o) => `- **${o.code} — ${o.name}:** ${o.proposedSolution} (+$${o.estimatedAnnualBenefitUsd.toLocaleString()}/yr)`).join("\n")}

## 10. Transformation Roadmap
${roadmapInitiatives.map((i) => `- **${i.code} (${i.wave}) — ${i.name}:** ${i.startDate} to ${i.endDate} · Owner: ${i.owner} · Target: ${i.successKpi}`).join("\n")}

## 11. Risks & Dependencies
${reportConfig.risksAndDependenciesText}

## 12. Recommended Next Steps
${reportConfig.keyRecommendationsText}

${reportConfig.nextStepsNarrative}

## 14. Data Sources & Assumptions
${reportConfig.assumptionsNoteText}
`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-executive-report.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast("Markdown report downloaded", "Saved 14-section report as .md file.");
  };

  const handleRunCfoCritique = async () => {
    setRunningCritique(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportText: `${reportConfig.executiveSummaryText}\n\n${reportConfig.keyRecommendationsText}\n\n${reportConfig.assumptionsNoteText}`,
        }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setCfoCritique(acc);
        }
      }
    } finally {
      setRunningCritique(false);
    }
  };

  const coverBgClass =
    reportConfig.theme === "ey-executive-navy"
      ? "bg-[#0D1B2E] text-white"
      : reportConfig.theme === "ey-classic-charcoal"
        ? "bg-[#1E293B] text-white"
        : "bg-slate-900 text-white";

  const chartData = valueSummary.categories.map((c) => ({
    lever: c.name.replace(/^\d+\.\s*/, "").slice(0, 16),
    valueK: Math.round(c.annualValueUsd / 1000),
  }));

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D1B2E] text-[#FFE600]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">
              Executive Report Studio — 14-Section Consulting Deliverable
            </h1>
            <p className="text-xs text-slate-500">
              Live document preview synced with KPIs, Benchmarks, Root Causes, Opportunities, Value Model &amp; Roadmap
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-extrabold text-slate-950 shadow-xs hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>
              {exportingPdf ? "Generating PDF…" : "Export 14-Section PDF"}
            </span>
          </button>
        </div>
      </div>

      {/* 3-Column Split Layout: Left Navigation (2 cols) | Center Document Preview (7 cols) | Right Editor & Config (3 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN: 14-Section Outline Navigation */}
        <aside className="no-print flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs lg:col-span-2 lg:sticky lg:top-16 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            14 Report Sections
          </span>
          <nav className="mt-2 space-y-1">
            {REPORT_SECTIONS.map((sec) => {
              const isCurr = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToReportSection(sec.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    isCurr
                      ? "bg-[#0D1B2E] font-bold text-[#FFE600]"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">
                    {sec.num}.
                  </span>
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTER COLUMN: Consulting Document Preview (14 Sections) */}
        <div className="space-y-6 lg:col-span-7">
          {/* SECTION 1: COVER PAGE */}
          <section
            id="sec_01"
            className={`rounded-xl border border-slate-300 p-8 shadow-md sm:p-10 ${coverBgClass}`}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FFE600] font-black text-slate-950">
                  EY
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-slate-200 uppercase">
                  AP Diagnostic Studio · Finance Transformation
                </span>
              </div>
              <span className="rounded bg-white/10 px-2.5 py-1 font-mono text-[11px] text-[#FFE600]">
                CONFIDENTIAL · BOARD DELIVERABLE
              </span>
            </div>

            {/* Yellow Title Block */}
            <div className="mt-8 rounded-lg bg-[#FFE600] p-6 text-slate-950 sm:p-8">
              <p className="text-xs font-extrabold tracking-[0.18em] uppercase">
                Client: {clientName}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {reportConfig.reportTitle}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {reportConfig.subtitle}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 tabular-nums">
              <div className="rounded-lg border border-white/15 bg-white/5 p-3.5">
                <p className="text-[11px] text-slate-300">Annual Volume</p>
                <p className="mt-1 text-xl font-extrabold text-white">
                  {coreMetrics.annualInvoices.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {coreMetrics.ftes} AP FTEs
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3.5">
                <p className="text-[11px] text-slate-300">PO-Backed / Touchless</p>
                <p className="mt-1 text-xl font-extrabold text-[#FFE600]">
                  {coreMetrics.poBackedRate}% / {coreMetrics.touchlessRate}%
                </p>
                <p className="text-[10px] text-slate-400">
                  Exceptions: {coreMetrics.exceptionRate}%
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3.5">
                <p className="text-[11px] text-slate-300">Gross Value Case</p>
                <p className="mt-1 text-xl font-extrabold text-emerald-400">
                  ${(valueSummary.grossAnnualBenefitUsd / 1000).toFixed(0)}k / yr
                </p>
                <p className="text-[10px] text-slate-400">
                  {valueSummary.scenario}
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3.5">
                <p className="text-[11px] text-slate-300">Payback &amp; 3Y ROI</p>
                <p className="mt-1 text-xl font-extrabold text-white">
                  {valueSummary.paybackMonths} mos
                </p>
                <p className="text-[10px] text-emerald-300">
                  ROI: {valueSummary.roiPct}%
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-4 text-xs text-slate-300">
              <span>Prepared For: {reportConfig.preparedFor}</span>
              <span>Prepared By: {reportConfig.preparedBy}</span>
            </div>
          </section>

          {/*DOCUMENT BODY SHEET */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
            {/* SECTION 2: EXECUTIVE SUMMARY */}
            <section id="sec_02" className="space-y-3">
              <SectionBanner num="02" title="Executive Summary" />
              <div className="rounded-lg border-l-4 border-[#FFE600] bg-slate-50 p-4 text-sm font-semibold text-slate-900">
                Core Thesis: Low upstream PO compliance ({coreMetrics.poBackedRate}%) and uncalibrated match tolerances drive an {coreMetrics.exceptionRate}% exception rate and {coreMetrics.cycleTimeDays.toFixed(1)}-day cycle time—forfeiting 62% of early-payment discounts and consuming 4.5 FTEs in avoidable rework and query handling.
              </div>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {reportConfig.executiveSummaryText}
              </p>
            </section>

            {/* SECTION 3: CLIENT OVERVIEW */}
            <section id="sec_03" className="space-y-3">
              <SectionBanner num="03" title="Client Overview & Operating Model" />
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {reportConfig.clientOverviewText}
              </p>
            </section>

            {/* SECTION 4: AP CURRENT-STATE PERFORMANCE */}
            <section id="sec_04" className="space-y-3">
              <SectionBanner num="04" title="AP Current-State Performance Baseline" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 tabular-nums">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Invoices / FTE
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {coreMetrics.invoicesPerFte.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-amber-700">Peer: 36,000</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Unit Cost / Inv
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    ${coreMetrics.costPerInvoice.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-amber-700">Peer: $5.20</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    On-Time Payment
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {coreMetrics.onTimePaymentRate}%
                  </p>
                  <p className="text-[11px] text-slate-600">
                    DPO: {coreMetrics.dpoDays} days
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Discount Capture
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {coreMetrics.discountCaptureRate}%
                  </p>
                  <p className="text-[11px] text-red-700">Peer: 68%</p>
                </div>
              </div>
            </section>

            {/* SECTION 5: DIAGNOSTIC FINDINGS (12-STAGE ASSESSMENT) */}
            <section id="sec_05" className="space-y-3">
              <SectionBanner num="05" title="Diagnostic Findings Across 12 Process Stages" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Stage
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Current
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Target
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Auto %
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Key Finding &amp; Control Observation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {processStages.map((s) => (
                      <tr key={s.id} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2 font-bold text-slate-900">
                          {s.order}. {s.name}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold">
                          L{s.maturityScore}/5
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-emerald-800">
                          L{s.targetMaturityScore}/5
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono">
                          {s.automationLevelPct}%
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-700">
                          {s.painPoints[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 6: BENCHMARK ANALYSIS */}
            <section id="sec_06" className="space-y-3">
              <SectionBanner num="06" title="Operational & Working Capital Benchmark Analysis" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        KPI
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Client
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Peer
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Best-in-Class
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Diagnostic Interpretation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiBenchmarks.map((k) => (
                      <tr key={k.id} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2 font-bold text-slate-900">
                          {k.shortName}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-extrabold text-slate-900">
                          {k.formattedClient}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono">
                          {k.peerBenchmark}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono text-emerald-800">
                          {k.bestInClassBenchmark}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-700">
                          {k.businessInterpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 7: ROOT CAUSE ANALYSIS */}
            <section id="sec_07" className="space-y-3">
              <SectionBanner num="07" title="Root Cause & Causal Chain Analysis" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Code
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Category
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Root Cause Mechanism &amp; Business Impact
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Impact ($/yr)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rootCauses.map((rc) => (
                      <tr key={rc.id} className="bg-white">
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-slate-900">
                          {rc.code}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-semibold">
                          {rc.category}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-700">
                          <strong className="text-slate-900">{rc.title}:</strong>{" "}
                          {rc.rootCauseStatement}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-red-700">
                          ${rc.estimatedAnnualImpactUsd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 8: AUTOMATION & AI OPPORTUNITIES */}
            <section id="sec_08" className="space-y-3">
              <SectionBanner num="08" title="Automation & AI Opportunity Portfolio" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Code
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Opportunity &amp; Proposed Solution
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Type
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Annual Value
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((o) => (
                      <tr key={o.id} className="bg-white">
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-slate-900">
                          {o.code}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-700">
                          <strong className="text-slate-900">{o.name}:</strong>{" "}
                          {o.proposedSolution}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2">
                          {o.automationType}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-emerald-700">
                          ${o.estimatedAnnualBenefitUsd.toLocaleString()}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-semibold">
                          {o.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 9: VALUE REALIZATION */}
            <section id="sec_09" className="space-y-3">
              <SectionBanner
                num="09"
                title={`Value Realization Business Case (${valueSummary.scenario})`}
              />
              <div className="h-52 w-full rounded-lg border border-slate-200 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="lever" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="k" />
                    <Tooltip formatter={(v) => [`$${v}k / yr`, "Benefit"]} />
                    <Bar dataKey="valueK" fill="#0D1B2E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Benefit Lever
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Type
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Calculation Basis
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 text-right font-extrabold">
                        Annual ($/yr)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueSummary.categories.map((c) => (
                      <tr key={c.id} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2 font-bold text-slate-900">
                          {c.name}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2">
                          {c.benefitType}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600">
                          {c.calculationDetail}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 text-right font-mono font-bold text-emerald-700">
                          ${c.annualValueUsd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 10: TRANSFORMATION ROADMAP */}
            <section id="sec_10" className="space-y-3">
              <SectionBanner num="10" title="3-Wave Transformation Roadmap" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Code
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Wave &amp; Initiative
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Timeline
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Owner
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Target Success Metric
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roadmapInitiatives.map((i) => (
                      <tr key={i.id} className="bg-white">
                        <td className="border border-slate-200 px-2.5 py-2 font-mono font-bold text-slate-900">
                          {i.code}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">
                            {i.wave}
                          </span>
                          <strong className="text-slate-900">{i.name}</strong>
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono">
                          {i.startDate} → {i.endDate}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2">
                          {i.owner}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-emerald-900 font-semibold">
                          {i.successKpi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 11: RISKS & DEPENDENCIES */}
            <section id="sec_11" className="space-y-3">
              <SectionBanner num="11" title="Implementation Risks & Dependencies" />
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {reportConfig.risksAndDependenciesText}
              </p>
            </section>

            {/* SECTION 12: RECOMMENDED NEXT STEPS */}
            <section id="sec_12" className="space-y-3">
              <SectionBanner num="12" title="Recommended Next Steps (30-60-90 Day Plan)" />
              <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                {reportConfig.keyRecommendationsText}
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900">
                {reportConfig.nextStepsNarrative}
              </div>
            </section>

            {/* SECTION 13: APPENDIX — EVIDENCE REGISTER */}
            <section id="sec_13" className="space-y-3">
              <SectionBanner num="13" title="Appendix: Evidence & Dataset Register" />
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#FFE600] text-slate-950 uppercase">
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        Dataset
                      </th>
                      <th className="border border-slate-300 px-3 py-2 font-extrabold">
                        File Name
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Records
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((d) => (
                      <tr key={d.id} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2 font-bold text-slate-900">
                          {d.datasetType}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600">
                          {d.fileName}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-mono">
                          {d.records.toLocaleString()}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-semibold">
                          {d.status} ({d.isUploadedByUser ? "User Uploaded" : "Demo Baseline"})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 14: DATA SOURCES & ASSUMPTIONS */}
            <section id="sec_14" className="space-y-3">
              <SectionBanner num="14" title="Data Sources, Methodology & Modelling Assumptions" />
              <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                {reportConfig.assumptionsNoteText}
              </p>
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Narrative Editor, Theme Config & Sceptical CFO Reviewer (3 cols) */}
        <aside className="no-print flex flex-col gap-4 lg:col-span-3">
          {/* Theme & Branding Config */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <Palette className="h-4 w-4" />
              <span>Report Theme &amp; Branding</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Cover &amp; Accent Theme
              </label>
              <select
                value={reportConfig.theme}
                onChange={(e) =>
                  updateReportConfig({
                    theme: e.target.value as ReportConfigState["theme"],
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
              >
                <option value="ey-executive-navy">EY Executive Navy (#0D1B2E)</option>
                <option value="ey-classic-charcoal">EY Classic Charcoal (#1E293B)</option>
                <option value="boardroom-light">Boardroom Slate</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Report Title
              </label>
              <input
                type="text"
                value={reportConfig.reportTitle}
                onChange={(e) =>
                  updateReportConfig({ reportTitle: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Prepared For
              </label>
              <input
                type="text"
                value={reportConfig.preparedFor}
                onChange={(e) =>
                  updateReportConfig({ preparedFor: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Live Section Text Editor */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <Edit3 className="h-4 w-4" />
              <span>Editable Executive Narrative</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Executive Summary (Section 02)
              </label>
              <textarea
                rows={5}
                value={reportConfig.executiveSummaryText}
                onChange={(e) =>
                  updateReportConfig({ executiveSummaryText: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Key Recommendations (Section 12)
              </label>
              <textarea
                rows={5}
                value={reportConfig.keyRecommendationsText}
                onChange={(e) =>
                  updateReportConfig({ keyRecommendationsText: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Risks &amp; Dependencies (Section 11)
              </label>
              <textarea
                rows={4}
                value={reportConfig.risksAndDependenciesText}
                onChange={(e) =>
                  updateReportConfig({
                    risksAndDependenciesText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Sceptical CFO Stress-Test Reviewer */}
          <div className="rounded-xl border border-slate-200 bg-[#0D1B2E] p-4 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#FFE600] uppercase">
                <ShieldAlert className="h-4 w-4" />
                <span>Sceptical CFO Audit</span>
              </span>
              <button
                type="button"
                onClick={handleRunCfoCritique}
                disabled={runningCritique}
                className="rounded bg-[#FFE600] px-2.5 py-1 text-[11px] font-extrabold text-slate-950 hover:opacity-90 disabled:opacity-50"
              >
                {runningCritique ? "Auditing…" : "Run CFO Stress-Test"}
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Runs the EY Reviewer Agent (<code>context/agents/reviewer.md</code>) to challenge weak claims before client sign-off.
            </p>
            {cfoCritique && (
              <div className="max-h-72 overflow-y-auto rounded border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                {cfoCritique}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionBanner({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-[#1E293B] px-4 py-2.5 text-white">
      <span className="h-5 w-1.5 bg-[#FFE600]" />
      <h3 className="text-xs font-extrabold tracking-wider uppercase">
        {num}. {title}
      </h3>
    </div>
  );
}
