"use client";

import React, { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Cpu,
  Sliders,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { OpportunityStatus } from "@/lib/studio/types";

function getQuadrantLabel(valueScore: number, complexityScore: number): {
  label: "Quick Wins" | "Strategic Investments" | "Tactical Improvements" | "Deprioritize";
  badgeClass: string;
} {
  if (valueScore >= 7.5 && complexityScore <= 5.0) {
    return { label: "Quick Wins", badgeClass: "bg-emerald-100 text-emerald-900" };
  }
  if (valueScore >= 7.5 && complexityScore > 5.0) {
    return {
      label: "Strategic Investments",
      badgeClass: "bg-amber-100 text-amber-900",
    };
  }
  if (valueScore < 7.5 && complexityScore <= 5.0) {
    return {
      label: "Tactical Improvements",
      badgeClass: "bg-sky-100 text-sky-900",
    };
  }
  return { label: "Deprioritize", badgeClass: "bg-slate-200 text-slate-700" };
}

export function OpportunitiesScreen() {
  const {
    opportunities,
    updateOpportunity,
    toggleOpportunityRoadmap,
  } = useStudio();

  const [selectedOppId, setSelectedOppId] = useState<string>(
    opportunities[0]?.id ?? "opp_04",
  );
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const activeOpp =
    opportunities.find((o) => o.id === selectedOppId) ?? opportunities[0];

  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && o.automationType !== typeFilter) return false;
      return true;
    });
  }, [opportunities, statusFilter, typeFilter]);

  const selectedPortfolioStats = useMemo(() => {
    const selected = opportunities.filter((o) => o.status === "Selected");
    const totalAnnualBenefit = selected.reduce(
      (s, o) => s + o.estimatedAnnualBenefitUsd,
      0,
    );
    const totalCost = selected.reduce(
      (s, o) => s + o.estimatedImplementationCostUsd,
      0,
    );
    const quickWinsCount = selected.filter(
      (o) => getQuadrantLabel(o.valueScore, o.complexityScore).label === "Quick Wins",
    ).length;
    return {
      count: selected.length,
      totalAnnualBenefit,
      totalCost,
      quickWinsCount,
    };
  }, [opportunities]);

  const scatterData = opportunities.map((o) => ({
    id: o.id,
    code: o.code,
    name: o.name,
    x: o.complexityScore,
    y: o.valueScore,
    z: Math.max(40, Math.round(o.estimatedAnnualBenefitUsd / 1500)),
    benefit: o.estimatedAnnualBenefitUsd,
    status: o.status,
    quadrant: getQuadrantLabel(o.valueScore, o.complexityScore).label,
  }));

  return (
    <div className="space-y-6">
      {/* 1. PORTFOLIO SUMMARY & PRIORITIZATION MATRIX */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Interactive 4-Quadrant Prioritization Matrix (6 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Interactive Prioritization Matrix
                </span>
                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                  Business Value vs. Implementation Complexity
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-900">
                  Quick Wins ({selectedPortfolioStats.quickWinsCount})
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                  Strategic
                </span>
              </div>
            </div>

            <div className="mt-3 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 20, bottom: 15, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Implementation Complexity"
                    domain={[1, 10]}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Implementation Complexity (1 = Low → 10 = High)",
                      position: "insideBottom",
                      offset: -8,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Business Value"
                    domain={[4, 10]}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Business Value (1–10)",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[90, 320]} />
                  <ReferenceLine x={5} stroke="#94A3B8" strokeDasharray="4 4" />
                  <ReferenceLine y={7.5} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-[#0D1B2E] p-3 text-xs text-white shadow-lg">
                          <p className="font-bold text-[#FFE600]">
                            {pt.code}: {pt.name}
                          </p>
                          <p className="mt-1">Quadrant: {pt.quadrant}</p>
                          <p>
                            Value: {pt.y}/10 · Complexity: {pt.x}/10
                          </p>
                          <p className="font-mono font-bold text-emerald-300">
                            Est. Value: ${(pt.benefit / 1000).toFixed(0)}k / yr
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    onClick={(point) => {
                      const id = (point as unknown as { id?: string; payload?: { id?: string } })?.id ??
                        (point as unknown as { payload?: { id?: string } })?.payload?.id;
                      if (id) setSelectedOppId(id);
                    }}
                    className="cursor-pointer"
                  >
                    {scatterData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={
                          entry.id === activeOpp.id
                            ? "#FFE600"
                            : entry.status === "Selected"
                              ? "#0D1B2E"
                              : "#94A3B8"
                        }
                        stroke={entry.id === activeOpp.id ? "#0F172A" : "#FFFFFF"}
                        strokeWidth={2}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant Legend & Selected Portfolio Totals */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center tabular-nums">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Selected Levers
              </p>
              <p className="text-base font-extrabold text-slate-900">
                {selectedPortfolioStats.count} of {opportunities.length}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50/70 p-2.5">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">
                Portfolio Annual Benefit
              </p>
              <p className="text-base font-extrabold text-emerald-950">
                ${selectedPortfolioStats.totalAnnualBenefit.toLocaleString()}/yr
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Est. Implementation Cost
              </p>
              <p className="text-base font-extrabold text-slate-900">
                ${selectedPortfolioStats.totalCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Selected Opportunity Detail & Assumption Editor (6 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6 space-y-4">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#0D1B2E] px-2 py-0.5 font-mono text-xs font-bold text-[#FFE600]">
                    {activeOpp.code}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      getQuadrantLabel(
                        activeOpp.valueScore,
                        activeOpp.complexityScore,
                      ).badgeClass
                    }`}
                  >
                    {
                      getQuadrantLabel(
                        activeOpp.valueScore,
                        activeOpp.complexityScore,
                      ).label
                    }
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {activeOpp.automationType}
                  </span>
                </div>
                <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">
                  {activeOpp.name}
                </h3>
              </div>

              {/* Status & Roadmap Toggle */}
              <div className="flex items-center gap-2">
                <select
                  value={activeOpp.status}
                  onChange={(e) =>
                    updateOpportunity(activeOpp.id, {
                      status: e.target.value as OpportunityStatus,
                      includeInRoadmap: e.target.value === "Selected",
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                >
                  <option value="Selected">✓ Selected</option>
                  <option value="Under Assessment">⏳ Under Assessment</option>
                  <option value="Rejected">✕ Rejected</option>
                </select>

                <button
                  type="button"
                  onClick={() => toggleOpportunityRoadmap(activeOpp.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-colors ${
                    activeOpp.includeInRoadmap
                      ? "bg-slate-900 text-[#FFE600]"
                      : "bg-[#FFE600] text-slate-950"
                  }`}
                >
                  {activeOpp.includeInRoadmap
                    ? "✓ In Roadmap"
                    : "+ Add to Roadmap"}
                </button>
              </div>
            </div>

            {/* Architecture, Current vs Future State */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Current State Pain Point
                </p>
                <p className="mt-1 text-xs text-slate-800">
                  {activeOpp.currentStateDetail}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">
                  Future State &amp; Target KPI
                </p>
                <p className="mt-1 text-xs text-slate-900">
                  {activeOpp.futureStateDetail}
                </p>
                <p className="mt-1 font-semibold text-xs text-emerald-800">
                  Target: {activeOpp.targetSuccessMetric}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1.5">
              <p>
                <strong className="text-slate-900">Solution Architecture:</strong>{" "}
                <code className="font-mono text-slate-800">
                  {activeOpp.solutionArchitecture}
                </code>
              </p>
              <p>
                <strong className="text-slate-900">Required Capabilities:</strong>{" "}
                {activeOpp.requiredCapabilities.join(" · ")}
              </p>
              <p>
                <strong className="text-slate-900">Implementation Approach:</strong>{" "}
                {activeOpp.implementationApproach}
              </p>
              <p className="text-amber-900">
                <strong>Risk &amp; Dependencies:</strong>{" "}
                {activeOpp.dependencies.join(", ")} — {activeOpp.riskConsiderations}
              </p>
            </div>

            {/* Editable Opportunity Assumptions */}
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <Sliders className="h-3.5 w-3.5" />
                <span>Editable Opportunity Assumptions &amp; Comments</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Annual Value ($/yr)
                  </label>
                  <input
                    type="number"
                    step={5000}
                    value={activeOpp.estimatedAnnualBenefitUsd}
                    onChange={(e) =>
                      updateOpportunity(activeOpp.id, {
                        estimatedAnnualBenefitUsd: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Est. Cost ($)
                  </label>
                  <input
                    type="number"
                    step={5000}
                    value={activeOpp.estimatedImplementationCostUsd}
                    onChange={(e) =>
                      updateOpportunity(activeOpp.id, {
                        estimatedImplementationCostUsd: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Value Score (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.2}
                    value={activeOpp.valueScore}
                    onChange={(e) =>
                      updateOpportunity(activeOpp.id, {
                        valueScore: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Complexity (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.2}
                    value={activeOpp.complexityScore}
                    onChange={(e) =>
                      updateOpportunity(activeOpp.id, {
                        complexityScore: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 tabular-nums"
                  />
                </div>
              </div>
              <input
                type="text"
                value={activeOpp.comments}
                onChange={(e) =>
                  updateOpportunity(activeOpp.id, { comments: e.target.value })
                }
                placeholder="Add reviewer comments or scoping assumptions…"
                className="mt-2.5 w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 12-OPPORTUNITY INTELLIGENCE CATALOG GRID */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Automation &amp; AI Opportunity Intelligence Catalog ({filteredOpps.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click any card to inspect its architecture or toggle inclusion in the Transformation Roadmap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "Selected", "Under Assessment", "Rejected"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    statusFilter === st
                      ? "bg-slate-900 text-[#FFE600]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Statuses" : st}
                </button>
              ),
            )}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
            >
              <option value="ALL">All Automation Types</option>
              <option value="Process & Policy">Process &amp; Policy</option>
              <option value="OCR / IDP">OCR / IDP</option>
              <option value="Agentic AI / ML">Agentic AI / ML</option>
              <option value="RPA / Workflow">RPA / Workflow</option>
              <option value="ERP Native">ERP Native</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpps.map((opp) => {
            const isSelected = opp.id === activeOpp.id;
            const quad = getQuadrantLabel(opp.valueScore, opp.complexityScore);

            return (
              <div
                key={opp.id}
                onClick={() => setSelectedOppId(opp.id)}
                className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-slate-900 bg-amber-50/30 shadow-sm ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#0D1B2E] px-2 py-0.5 font-mono text-[11px] font-bold text-[#FFE600]">
                        {opp.code}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${quad.badgeClass}`}
                      >
                        {quad.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-emerald-700 tabular-nums">
                      +${(opp.estimatedAnnualBenefitUsd / 1000).toFixed(0)}k/yr
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-extrabold text-slate-900 leading-snug">
                    {opp.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                    {opp.description}
                  </p>
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Cpu className="h-3 w-3 text-slate-400" />
                      {opp.automationType}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{opp.effortWeeks}w</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleOpportunityRoadmap(opp.id)}
                    className={`rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                      opp.includeInRoadmap
                        ? "bg-slate-900 text-[#FFE600]"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {opp.includeInRoadmap ? "✓ Roadmap" : "+ Roadmap"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
