"use client";

import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Filter,
  Info,
  Calculator,
  Database,
  GitBranch,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { BenchmarkFilterState, KpiId } from "@/lib/studio/types";
import { DiagnosticGate } from "../DiagnosticGate";

export function BenchmarkScreen() {
  const {
    benchmarkFilters,
    kpiBenchmarks,
    processStages,
    rootCauses,
    opportunities,
    datasets,
    coreMetrics,
    updateBenchmarkFilters,
    openKpiDrilldown,
    navigateTo,
  } = useStudio();

  const [selectedKpiId, setSelectedKpiId] = useState<KpiId>("po_backed_rate");

  if (coreMetrics.answeredCount === 0 && datasets.length === 0) {
    return (
      <DiagnosticGate
        screenTitle="Peer & Best-in-Class Benchmark Analysis"
        description="KPI benchmarking requires client operational metrics (volume, FTEs, PO split, exception rate, cycle time, and discount capture). Enter responses in the Diagnostic Interview or load the SAP extracts first."
      />
    );
  }

  const activeKpi =
    kpiBenchmarks.find((k) => k.id === selectedKpiId) ?? kpiBenchmarks[0];

  // Radar chart data across 6 grouped capability dimensions
  const radarData = [
    {
      dimension: "Supplier Controls",
      client: processStages[0]?.maturityScore ?? 1,
      peer: 3.8,
      bestInClass: 4.6,
    },
    {
      dimension: "PO Compliance",
      client: processStages[2]?.maturityScore ?? 2,
      peer: 4.1,
      bestInClass: 4.8,
    },
    {
      dimension: "Capture & IDP",
      client: processStages[5]?.maturityScore ?? 2,
      peer: 4.0,
      bestInClass: 4.7,
    },
    {
      dimension: "3-Way Match",
      client: processStages[6]?.maturityScore ?? 2,
      peer: 4.2,
      bestInClass: 4.8,
    },
    {
      dimension: "Exception & Approval",
      client: processStages[8]?.maturityScore ?? 2,
      peer: 3.9,
      bestInClass: 4.6,
    },
    {
      dimension: "Payments & Analytics",
      client: processStages[9]?.maturityScore ?? 3,
      peer: 4.1,
      bestInClass: 4.7,
    },
  ];

  const linkedRcs = rootCauses.filter((r) =>
    activeKpi.linkedRootCauseIds.includes(r.id),
  );
  const linkedOpps = opportunities.filter((o) =>
    activeKpi.linkedOpportunityIds.includes(o.id),
  );
  const linkedDs = datasets.filter((d) =>
    activeKpi.linkedDatasetIds.includes(d.id),
  );

  return (
    <div className="space-y-6">
      {/* 1. BENCHMARK COHORT FILTER STRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-800" />
            <h2 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              Peer Cohort Filters
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Reference Cohort: n = 142 Enterprises</span>
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Industry Sector
            </label>
            <select
              value={benchmarkFilters.industry}
              onChange={(e) =>
                updateBenchmarkFilters({
                  industry: e.target.value as BenchmarkFilterState["industry"],
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="Industrial Manufacturing">Industrial Manufacturing</option>
              <option value="Consumer Goods">Consumer Goods</option>
              <option value="Technology & Telecom">Technology &amp; Telecom</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="All Industries">All Industries</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Company Revenue Size
            </label>
            <select
              value={benchmarkFilters.companySize}
              onChange={(e) =>
                updateBenchmarkFilters({
                  companySize: e.target.value as BenchmarkFilterState["companySize"],
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="$250M – $1B Revenue">$250M – $1B Revenue</option>
              <option value="< $250M Revenue">&lt; $250M Revenue</option>
              <option value="> $1B Enterprise">&gt; $1B Enterprise</option>
              <option value="All Sizes">All Sizes</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Geographic / SSC Region
            </label>
            <select
              value={benchmarkFilters.region}
              onChange={(e) =>
                updateBenchmarkFilters({
                  region: e.target.value as BenchmarkFilterState["region"],
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="Global Peer Group">Global Peer Group</option>
              <option value="North America & Europe">North America &amp; Europe</option>
              <option value="India & APAC SSC">India &amp; APAC SSC</option>
              <option value="Emerging Markets">Emerging Markets</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Process Complexity
            </label>
            <select
              value={benchmarkFilters.complexity}
              onChange={(e) =>
                updateBenchmarkFilters({
                  complexity: e.target.value as BenchmarkFilterState["complexity"],
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="High Multi-Entity">High Multi-Entity</option>
              <option value="Moderate">Moderate</option>
              <option value="Single ERP">Single ERP</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Data Period
            </label>
            <select
              value={benchmarkFilters.dataPeriod}
              onChange={(e) =>
                updateBenchmarkFilters({
                  dataPeriod: e.target.value as BenchmarkFilterState["dataPeriod"],
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="FY2026 Rolling 12M">FY2026 Rolling 12M</option>
              <option value="FY2025 Full Year">FY2025 Full Year</option>
              <option value="Q1–Q3 Benchmark">Q1–Q3 Benchmark</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL BENCHMARK COMPARISON BARS & INTERACTIVE KPI SELECTOR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: High-Density 11 KPI Benchmark Matrix (7 cols) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                11 Core AP Operational &amp; Working Capital KPIs
              </h2>
              <p className="text-xs text-slate-500">
                Select any KPI row to inspect its formula, trajectory, and causal linkages.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0D1B2E]" />
                Client
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-1 bg-[#0F8B8D]" />
                Peer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-1 bg-[#EAB308]" />
                Best-in-Class
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full border-collapse text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase">
                  <th className="px-3.5 py-2.5 font-bold">Operational KPI</th>
                  <th className="w-36 px-3 py-2.5 font-bold">Relative Position</th>
                  <th className="px-2.5 py-2.5 text-right font-bold">Client</th>
                  <th className="px-2.5 py-2.5 text-right font-bold">Peer</th>
                  <th className="px-2.5 py-2.5 text-right font-bold">BiC</th>
                  <th className="px-3 py-2.5 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpiBenchmarks.map((k) => {
                  const isSelected = k.id === activeKpi.id;
                  const maxVal = Math.max(
                    k.clientValue,
                    k.industryBenchmark,
                    k.peerBenchmark,
                    k.bestInClassBenchmark,
                    1,
                  );
                  const clientWidth = Math.min(
                    100,
                    Math.max(6, (k.clientValue / maxVal) * 100),
                  );
                  const peerPos = Math.min(
                    98,
                    Math.max(4, (k.peerBenchmark / maxVal) * 100),
                  );
                  const bicPos = Math.min(
                    98,
                    Math.max(4, (k.bestInClassBenchmark / maxVal) * 100),
                  );

                  return (
                    <tr
                      key={k.id}
                      onClick={() => setSelectedKpiId(k.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-amber-50/70 font-semibold"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-900">{k.name}</span>
                        <span className="block text-[10px] text-slate-400">
                          {k.formattedGapVsPeer}
                        </span>
                      </td>

                      {/* Unified Bullet Bar (Client Bar + Peer & BiC Markers) */}
                      <td className="px-3 py-3">
                        <div className="relative h-2.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0D1B2E]"
                            style={{ width: `${clientWidth}%` }}
                          />
                          <span
                            title={`Peer: ${k.peerBenchmark}`}
                            className="absolute -top-1 h-4.5 w-1 rounded-xs bg-[#0F8B8D]"
                            style={{ left: `${peerPos}%` }}
                          />
                          <span
                            title={`Best-in-Class: ${k.bestInClassBenchmark}`}
                            className="absolute -top-1 h-4.5 w-1 rounded-xs bg-[#EAB308]"
                            style={{ left: `${bicPos}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-2.5 py-3 text-right font-mono font-extrabold text-slate-900">
                        {k.formattedClient}
                      </td>
                      <td className="px-2.5 py-3 text-right font-mono text-teal-800">
                        {k.peerBenchmark}
                      </td>
                      <td className="px-2.5 py-3 text-right font-mono text-amber-800">
                        {k.bestInClassBenchmark}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            k.classification === "Critical Gap"
                              ? "bg-red-100 text-red-800"
                              : k.classification === "Below Peer"
                                ? "bg-amber-100 text-amber-800"
                                : k.classification === "Near Peer"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {k.classification}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Dedicated KPI Drill-Down & Radar / Trend Charts (5 cols) */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Selected KPI Dedicated Drill-down Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[10px] font-extrabold text-slate-950 uppercase">
                  KPI Deep-Dive Analysis
                </span>
                <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">
                  {activeKpi.name}
                </h3>
                <p className="text-xs text-slate-500">{activeKpi.dataSource}</p>
              </div>
              <button
                type="button"
                onClick={() => openKpiDrilldown(activeKpi.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                <span>Full Drawer</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center tabular-nums">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Client</p>
                <p className="mt-0.5 text-base font-extrabold text-slate-900">
                  {activeKpi.formattedClient}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Peer ({activeKpi.formattedGapVsPeer})
                </p>
                <p className="mt-0.5 text-base font-extrabold text-teal-800">
                  {activeKpi.peerBenchmark} {activeKpi.unit}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Best-in-Class
                </p>
                <p className="mt-0.5 text-base font-extrabold text-emerald-800">
                  {activeKpi.bestInClassBenchmark} {activeKpi.unit}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                <Calculator className="h-3.5 w-3.5" />
                <span>Calculation Formula</span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-800">
                {activeKpi.formula}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Business Interpretation
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-800">
                {activeKpi.businessInterpretation}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <TrendingUp className="h-4 w-4 text-emerald-700" />
                  <span>Potential Financial Impact</span>
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-900 tabular-nums">
                  +${activeKpi.potentialFinancialImpactUsd.toLocaleString()} / yr
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700">
                {activeKpi.improvementOpportunity}
              </p>
            </div>

            {/* 6-Month Rolling Trend Chart for Selected KPI */}
            <div>
              <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                6-Month KPI Trajectory vs. Peer &amp; Best-in-Class
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeKpi.monthlyTrend}
                    margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="client"
                      name="Client"
                      stroke="#0D1B2E"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="peer"
                      name="Peer"
                      stroke="#0F8B8D"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestInClass"
                      name="Best-in-Class"
                      stroke="#EAB308"
                      strokeDasharray="2 2"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Traceability chips */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-bold text-slate-700">Root Causes:</span>
                {linkedRcs.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigateTo("root-causes")}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 hover:bg-[#FFE600]"
                  >
                    {r.code}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-bold text-slate-700">Opportunities:</span>
                {linkedOpps.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => navigateTo("opportunities")}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 hover:bg-[#FFE600]"
                  >
                    {o.code}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-bold text-slate-700">Evidence:</span>
                {linkedDs.map((d) => (
                  <span
                    key={d.id}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                  >
                    {d.datasetType}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Maturity Radar Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Multi-Dimensional AP Capability Radar
            </h3>
            <p className="text-xs text-slate-500">
              Client Maturity vs. Peer Median &amp; Best-in-Class (Scale 1–5)
            </p>
            <div className="mt-2 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#CBD5E1" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Client Current"
                    dataKey="client"
                    stroke="#0D1B2E"
                    fill="#0D1B2E"
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="Peer Benchmark"
                    dataKey="peer"
                    stroke="#0F8B8D"
                    fill="#0F8B8D"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Best-in-Class"
                    dataKey="bestInClass"
                    stroke="#EAB308"
                    fill="#EAB308"
                    fillOpacity={0.15}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
