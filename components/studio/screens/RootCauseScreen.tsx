"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowRight,
  Database,
  Sparkles,
  Sliders,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { KpiId, RootCauseCategory, RootCauseItem } from "@/lib/studio/types";
import { DiagnosticGate } from "../DiagnosticGate";

const ROOT_CAUSE_CATEGORIES: RootCauseCategory[] = [
  "Process",
  "Technology",
  "People",
  "Data",
  "Governance",
  "Policy",
  "Supplier behavior",
  "Organizational structure",
];

export function RootCauseScreen() {
  const {
    rootCauses,
    kpiBenchmarks,
    datasets,
    opportunities,
    coreMetrics,
    addRootCause,
    updateRootCause,
    deleteRootCause,
    openKpiDrilldown,
    openDrilldown,
  } = useStudio();

  const hasAnyInputs = coreMetrics.answeredCount > 0 || datasets.length > 0;
  const isAns = (code: string) => coreMetrics.answeredFieldCodes.includes(code);
  const hasDs = (dsId: string) => datasets.some((d) => d.id === dsId);

  // Only surface root causes whose underlying interview questions or SAP extracts have been captured
  const unlockedRootCauses = rootCauses.filter((rc) => {
    if (rc.id === "rc_01") return isAns("ap_04") || isAns("ap_03") || hasDs("ds_invoice_extract");
    if (rc.id === "rc_02") return isAns("ap_07") || isAns("ap_08") || hasDs("ds_aging_extract");
    if (rc.id === "rc_03") return isAns("ap_09") || isAns("ap_14") || hasDs("ds_po_extract");
    if (rc.id === "rc_04") return isAns("ap_02_21") || isAns("ap_01") || hasDs("ds_vendor_master");
    if (rc.id === "rc_05") return isAns("ap_17") || isAns("ap_01") || hasDs("ds_vendor_master");
    return true;
  });

  const [selectedRcId, setSelectedRcId] = useState<string>(
    unlockedRootCauses[0]?.id ?? "rc_01",
  );
  const [categoryFilter, setCategoryFilter] = useState<RootCauseCategory | "ALL">(
    "ALL",
  );
  const [showAddForm, setShowAddForm] = useState(false);

  // New root cause form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<RootCauseCategory>("Process");
  const [newKpiId, setNewKpiId] = useState<KpiId>("exception_rate");
  const newSeverity: RootCauseItem["severity"] = "High";
  const [newImpactUsd, setNewImpactUsd] = useState(85000);
  const [newStatement, setNewStatement] = useState("");
  const [newLever, setNewLever] = useState("");

  if (!hasAnyInputs || unlockedRootCauses.length === 0) {
    return (
      <DiagnosticGate
        screenTitle="Root Cause Analysis"
        description="Causal chains (RC-01 through RC-05) are synthesized only after you capture the corresponding interview responses (PO split, exception rate, cycle time, discount capture, and SoD controls) or ingest the SAP data extracts."
      />
    );
  }

  const filteredRootCauses =
    categoryFilter === "ALL"
      ? unlockedRootCauses
      : unlockedRootCauses.filter((r) => r.category === categoryFilter);

  const activeRc =
    unlockedRootCauses.find((r) => r.id === selectedRcId) ?? unlockedRootCauses[0];

  const handleCreateRootCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStatement.trim()) return;
    const kpi = kpiBenchmarks.find((k) => k.id === newKpiId);
    addRootCause({
      title: newTitle.trim(),
      category: newCategory,
      observedKpiId: newKpiId,
      performanceGapSummary: kpi
        ? `${kpi.name}: ${kpi.formattedClient} (${kpi.formattedGapVsPeer})`
        : "KPI gap identified",
      rootCauseStatement: newStatement.trim(),
      whyItHappens: newStatement.trim(),
      businessImpactSummary: `Estimated $${newImpactUsd.toLocaleString()}/yr in operational rework and delay.`,
      estimatedAnnualImpactUsd: newImpactUsd,
      improvementLever:
        newLever.trim() || "Standardize workflow and enable automated validation.",
      severity: newSeverity,
      affectedStageIds: ["stage_07", "stage_08"],
      linkedDatasetIds: ["ds_invoice_extract"],
      linkedOpportunityIds: ["opp_04"],
    });
    setNewTitle("");
    setNewStatement("");
    setNewLever("");
    setShowAddForm(false);
  };

  const totalAnnualImpact = unlockedRootCauses.reduce(
    (s, r) => s + r.estimatedAnnualImpactUsd,
    0,
  );

  return (
    <div className="space-y-5">
      {/* 1. TOP COMMAND BAR & ACTIVE CAUSAL CHAIN STRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                categoryFilter === "ALL"
                  ? "bg-[#0D1B2E] text-[#FFE600]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({unlockedRootCauses.length})
            </button>
            {ROOT_CAUSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? "bg-[#0D1B2E] text-[#FFE600]"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-right">
              <span className="text-[10px] font-bold text-amber-900 uppercase">
                Quantified Drag:{" "}
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900 tabular-nums">
                ${totalAnnualImpact.toLocaleString()}/yr
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Root Cause</span>
            </button>
          </div>
        </div>

        {/* Add Root Cause Inline Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateRootCause}
            className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                Create New Diagnostic Root Cause
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Root Cause Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Decentralized plant freight invoice coding"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as RootCauseCategory)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                >
                  {ROOT_CAUSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Observed KPI
                </label>
                <select
                  value={newKpiId}
                  onChange={(e) => setNewKpiId(e.target.value as KpiId)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                >
                  {kpiBenchmarks.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.shortName} ({k.formattedClient})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Root Cause Mechanism (Why it happens)
                </label>
                <input
                  type="text"
                  required
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  placeholder="Explain the underlying process/policy/system mechanism…"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Improvement Lever
                </label>
                <input
                  type="text"
                  value={newLever}
                  onChange={(e) => setNewLever(e.target.value)}
                  placeholder="Recommended fix…"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Impact ($/yr)
                  </label>
                  <input
                    type="number"
                    value={newImpactUsd}
                    onChange={(e) => setNewImpactUsd(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Active Root Cause 5-Node Visual Causal Chain */}
        {activeRc && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Active Causal Chain:{" "}
                <span className="font-mono text-slate-900">{activeRc.code}</span> —{" "}
                {activeRc.title}
              </span>
              <span className="font-mono font-bold text-red-700 tabular-nums">
                Cost of Problem: ${(activeRc.estimatedAnnualImpactUsd / 1000).toFixed(0)}k / yr
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  1. Observed KPI
                </p>
                <p className="mt-1 text-xs font-extrabold text-slate-900">
                  {kpiBenchmarks.find((k) => k.id === activeRc.observedKpiId)?.name ??
                    activeRc.observedKpiId}
                </p>
                <p className="font-mono text-xs font-bold text-amber-800">
                  {kpiBenchmarks.find((k) => k.id === activeRc.observedKpiId)?.formattedClient}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  2. Performance Gap
                </p>
                <p className="mt-1 text-xs text-slate-700 leading-snug">
                  {activeRc.performanceGapSummary}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0D1B2E] p-3 text-white">
                <p className="text-[10px] font-bold text-[#FFE600] uppercase">
                  3. Root Cause ({activeRc.category})
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-100">
                  {activeRc.rootCauseStatement}
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <p className="text-[10px] font-bold text-red-800 uppercase">
                  4. Business Impact
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-800">
                  {activeRc.businessImpactSummary}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">
                  5. Improvement Lever
                </p>
                <p className="mt-1 text-xs font-semibold leading-snug text-emerald-950">
                  {activeRc.improvementLever}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MASTER-DETAIL: SCANNABLE ROOT CAUSE LIST (5 cols) + INSPECTOR & EDITOR (7 cols) */}
      {activeRc && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Scannable Root Cause Register (5 cols) */}
          <div className="flex flex-col gap-2.5 lg:col-span-5">
            {filteredRootCauses.map((rc) => {
              const kpi = kpiBenchmarks.find((k) => k.id === rc.observedKpiId);
              const isSelected = activeRc.id === rc.id;

              return (
                <button
                  key={rc.id}
                  type="button"
                  onClick={() => setSelectedRcId(rc.id)}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-slate-900 bg-white shadow-sm ring-2 ring-[#FFE600]"
                      : "border-slate-200 bg-white/80 hover:border-slate-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#0D1B2E] px-2 py-0.5 font-mono text-[11px] font-bold text-[#FFE600]">
                        {rc.code}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                        {rc.category}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          rc.severity === "Critical"
                            ? "bg-red-100 text-red-800"
                            : rc.severity === "High"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {rc.severity}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-red-700 tabular-nums">
                      ${(rc.estimatedAnnualImpactUsd / 1000).toFixed(0)}k/yr
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-extrabold text-slate-900 leading-snug">
                    {rc.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    KPI: <strong className="text-slate-700">{kpi?.shortName}</strong> ({kpi?.formattedClient})
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Unified Root Cause Editor & Traceability (7 cols) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-800" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Root Cause Configuration: {activeRc.code}
                </h3>
              </div>
              {rootCauses.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    deleteRootCause(activeRc.id);
                    setSelectedRcId(rootCauses[0]?.id ?? "");
                  }}
                  className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Root Cause Category
                </label>
                <select
                  value={activeRc.category}
                  onChange={(e) =>
                    updateRootCause(activeRc.id, {
                      category: e.target.value as RootCauseCategory,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  {ROOT_CAUSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Severity Classification
                </label>
                <select
                  value={activeRc.severity}
                  onChange={(e) =>
                    updateRootCause(activeRc.id, {
                      severity: e.target.value as RootCauseItem["severity"],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Estimated Annual Impact ($/yr)
                </label>
                <input
                  type="number"
                  step={5000}
                  value={activeRc.estimatedAnnualImpactUsd}
                  onChange={(e) =>
                    updateRootCause(activeRc.id, {
                      estimatedAnnualImpactUsd: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Root Cause Statement (What is broken)
                </label>
                <textarea
                  rows={2}
                  value={activeRc.rootCauseStatement}
                  onChange={(e) =>
                    updateRootCause(activeRc.id, {
                      rootCauseStatement: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Underlying Mechanism (Why it happens)
                </label>
                <textarea
                  rows={2}
                  value={activeRc.whyItHappens}
                  onChange={(e) =>
                    updateRootCause(activeRc.id, {
                      whyItHappens: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Recommended Improvement Lever
              </label>
              <input
                type="text"
                value={activeRc.improvementLever}
                onChange={(e) =>
                  updateRootCause(activeRc.id, {
                    improvementLever: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>

            {/* Integrated Traceability Footer inside Right Panel */}
            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
              {/* Linked KPI */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Observed KPI
                </p>
                <button
                  type="button"
                  onClick={() => openKpiDrilldown(activeRc.observedKpiId)}
                  className="mt-1.5 flex w-full items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:border-slate-900"
                >
                  <span className="truncate">
                    {kpiBenchmarks.find((k) => k.id === activeRc.observedKpiId)?.shortName}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-amber-800" />
                </button>
              </div>

              {/* Linked Opportunities */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  <span>Linked Levers</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {opportunities
                    .filter((o) => activeRc.linkedOpportunityIds.includes(o.id))
                    .map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          openDrilldown({ type: "opportunity", opportunityId: o.id })
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-bold text-slate-900 hover:border-slate-900"
                      >
                        {o.code}
                      </button>
                    ))}
                </div>
              </div>

              {/* Linked Datasets */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <Database className="h-3 w-3 text-slate-500" />
                  <span>Evidence</span>
                </p>
                <div className="mt-1.5 space-y-1">
                  {datasets
                    .filter((d) => activeRc.linkedDatasetIds.includes(d.id))
                    .map((d) => (
                      <div
                        key={d.id}
                        className="truncate text-[11px] font-semibold text-slate-700"
                      >
                        {d.datasetType}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
