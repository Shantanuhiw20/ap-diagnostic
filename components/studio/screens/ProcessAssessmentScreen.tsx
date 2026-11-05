"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Database,
  Sparkles,
  Plus,
  Trash2,
  User,
  Layers,
  Shield,
  Sliders,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { MaturityLevel } from "@/lib/studio/types";
import { DiagnosticGate } from "../DiagnosticGate";

const MATURITY_LEVEL_META: Record<
  MaturityLevel,
  { label: string; desc: string; bg: string; text: string; cellBg: string }
> = {
  1: {
    label: "Level 1 — Ad hoc",
    desc: "Manual, unstandardized, reactive with critical control gaps.",
    bg: "bg-red-100",
    text: "text-red-900",
    cellBg: "bg-red-500 text-white",
  },
  2: {
    label: "Level 2 — Developing",
    desc: "Basic ERP process defined, but high exception rework & manual routing.",
    bg: "bg-amber-100",
    text: "text-amber-900",
    cellBg: "bg-amber-400 text-slate-950",
  },
  3: {
    label: "Level 3 — Standardized",
    desc: "Documented governance, enforced controls, and consistent execution.",
    bg: "bg-sky-100",
    text: "text-sky-900",
    cellBg: "bg-sky-500 text-white",
  },
  4: {
    label: "Level 4 — Optimized",
    desc: "High touchless automation, proactive SLA escalation, and root-cause analytics.",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    cellBg: "bg-emerald-600 text-white",
  },
  5: {
    label: "Level 5 — Intelligent",
    desc: "Autonomous AI/IDP extraction, predictive cash flow, and continuous self-healing.",
    bg: "bg-slate-900",
    text: "text-[#FFE600]",
    cellBg: "bg-[#0D1B2E] text-[#FFE600]",
  },
};

export function ProcessAssessmentScreen() {
  const {
    processStages,
    kpiBenchmarks,
    datasets,
    opportunities,
    coreMetrics,
    updateProcessStage,
    openKpiDrilldown,
    openDrilldown,
  } = useStudio();

  const [selectedStageId, setSelectedStageId] = useState<string>(
    processStages[0]?.id ?? "stage_01",
  );
  const [newPainPoint, setNewPainPoint] = useState("");

  const activeStage =
    processStages.find((s) => s.id === selectedStageId) ?? processStages[0];

  const linkedKpis = kpiBenchmarks.filter((k) =>
    activeStage.linkedKpiIds.includes(k.id),
  );
  const linkedDatasets = datasets.filter((d) =>
    activeStage.linkedDatasetIds.includes(d.id),
  );
  const linkedOpps = opportunities.filter((o) =>
    activeStage.linkedOpportunityIds.includes(o.id),
  );

  const handleAddPainPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPainPoint.trim();
    if (!trimmed) return;
    updateProcessStage(activeStage.id, {
      painPoints: [...activeStage.painPoints, trimmed],
    });
    setNewPainPoint("");
  };

  const handleRemovePainPoint = (idx: number) => {
    updateProcessStage(activeStage.id, {
      painPoints: activeStage.painPoints.filter((_, i) => i !== idx),
    });
  };

  if (coreMetrics.answeredCount === 0 && datasets.length === 0) {
    return (
      <DiagnosticGate
        screenTitle="12-Stage Process Assessment"
        description="End-to-end AP process maturity scoring and control effectiveness are evaluated once you begin the Diagnostic Interview or load the SAP evidence extracts."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. MATURITY LEGEND & 12-STAGE PIPELINE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              12-Stage AP Value Chain
            </span>
            <span className="text-slate-300">·</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {([1, 2, 3, 4, 5] as MaturityLevel[]).map((lvl) => (
                <span
                  key={lvl}
                  title={MATURITY_LEVEL_META[lvl].desc}
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${MATURITY_LEVEL_META[lvl].cellBg}`}
                >
                  {MATURITY_LEVEL_META[lvl].label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 tabular-nums">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Client Avg:{" "}
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900">
                {coreMetrics.avgMaturity.toFixed(1)}/5.0
              </span>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-right">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">
                Peer Avg:{" "}
              </span>
              <span className="font-mono text-sm font-extrabold text-emerald-950">
                3.6/5.0
              </span>
            </div>
          </div>
        </div>

        {/* 12-Stage Visual Process Flow Pipeline */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {processStages.map((stage) => {
            const isSelected = stage.id === activeStage.id;
            const meta = MATURITY_LEVEL_META[stage.maturityScore];

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-slate-900 bg-[#0D1B2E] text-white shadow-md ring-2 ring-[#FFE600]"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isSelected ? "text-[#FFE600]" : "text-slate-400"
                    }`}
                  >
                    STAGE {String(stage.order).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${meta.cellBg}`}
                  >
                    L{stage.maturityScore}
                  </span>
                </div>

                <p className="mt-2 text-xs font-extrabold leading-snug">
                  {stage.name}
                </p>

                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/20 pt-2 font-mono text-[10px] tabular-nums">
                  <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                    Auto: {stage.automationLevelPct}%
                  </span>
                  <span
                    className={
                      isSelected
                        ? "font-semibold text-[#FFE600]"
                        : "font-semibold text-slate-600"
                    }
                  >
                    Target: L{stage.targetMaturityScore}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELECTED STAGE DETAIL & EDIT WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Stage Assessment Controls & Workflow Details (7 cols) */}
        <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#0D1B2E] px-2.5 py-0.5 font-mono text-xs font-bold text-[#FFE600]">
                  STAGE {String(activeStage.order).padStart(2, "0")}
                </span>
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                    MATURITY_LEVEL_META[activeStage.maturityScore].cellBg
                  }`}
                >
                  {MATURITY_LEVEL_META[activeStage.maturityScore].label}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                {activeStage.name}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {activeStage.description}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Peer Benchmark Maturity
              </p>
              <p className="text-base font-extrabold text-slate-900 tabular-nums">
                {activeStage.benchmarkMaturityScore.toFixed(1)} / 5.0
              </p>
              <p className="text-[10px] text-amber-700 font-semibold">
                Gap: {(activeStage.maturityScore - activeStage.benchmarkMaturityScore).toFixed(1)} pts
              </p>
            </div>
          </div>

          {/* Interactive Editable Assessment Controls */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <Sliders className="h-4 w-4 text-slate-800" />
              <span>Editable Stage Assessment Scores (Persists &amp; Updates Heatmap)</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Process Maturity (1–5)
                </label>
                <select
                  value={activeStage.maturityScore}
                  onChange={(e) =>
                    updateProcessStage(activeStage.id, {
                      maturityScore: Number(e.target.value) as MaturityLevel,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map((l) => (
                    <option key={l} value={l}>
                      {MATURITY_LEVEL_META[l].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Target 12M Maturity (1–5)
                </label>
                <select
                  value={activeStage.targetMaturityScore}
                  onChange={(e) =>
                    updateProcessStage(activeStage.id, {
                      targetMaturityScore: Number(e.target.value) as MaturityLevel,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map((l) => (
                    <option key={l} value={l}>
                      {MATURITY_LEVEL_META[l].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Automation Level ({activeStage.automationLevelPct}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={activeStage.automationLevelPct}
                  onChange={(e) =>
                    updateProcessStage(activeStage.id, {
                      automationLevelPct: Number(e.target.value),
                    })
                  }
                  className="mt-2.5 w-full accent-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Standardization (1–5)
                </label>
                <select
                  value={activeStage.standardizationScore}
                  onChange={(e) =>
                    updateProcessStage(activeStage.id, {
                      standardizationScore: Number(e.target.value) as MaturityLevel,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map((l) => (
                    <option key={l} value={l}>
                      Level {l} / 5
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Control Effectiveness (1–5)
                </label>
                <select
                  value={activeStage.controlEffectivenessScore}
                  onChange={(e) =>
                    updateProcessStage(activeStage.id, {
                      controlEffectivenessScore: Number(e.target.value) as MaturityLevel,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900"
                >
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map((l) => (
                    <option key={l} value={l}>
                      Level {l} / 5
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Process Owner
                </label>
                <div className="relative mt-1 flex items-center">
                  <User className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={activeStage.processOwner}
                    onChange={(e) =>
                      updateProcessStage(activeStage.id, {
                        processOwner: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2.5 pl-8 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current-State Workflow, Systems, Activities, Controls, Roles */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Current-State Operational Workflow
              </h4>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-800">
                {activeStage.currentStateWorkflow}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3.5">
                <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                  <Layers className="h-3.5 w-3.5 text-slate-600" />
                  <span>Systems &amp; Key Activities</span>
                </h5>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeStage.systemsInvolved.map((sys) => (
                    <span
                      key={sys}
                      className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {activeStage.activities.map((act) => (
                    <li key={act}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 p-3.5">
                <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                  <Shield className="h-3.5 w-3.5 text-slate-600" />
                  <span>Controls &amp; Participating Roles</span>
                </h5>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeStage.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {activeStage.controls.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Editable Pain Points */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-900 uppercase">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span>Stage Pain Points ({activeStage.painPoints.length})</span>
              </h4>
              <ul className="mt-2 space-y-1.5">
                {activeStage.painPoints.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded border border-amber-200/80 bg-white px-3 py-2 text-xs text-slate-800"
                  >
                    <span>• {pt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePainPoint(idx)}
                      className="text-slate-400 hover:text-red-600"
                      title="Remove pain point"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddPainPoint} className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  value={newPainPoint}
                  onChange={(e) => setNewPainPoint(e.target.value)}
                  placeholder="Add an observed operational pain point for this stage…"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Active Stage Scorecard & Traceability (5 cols) */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Active Stage Multi-Dimension Scorecard */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stage Capability &amp; Control Scorecard
                </h3>
                <p className="text-xs text-slate-500">
                  Multi-dimensional comparison for {activeStage.shortName}
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                Auto: {activeStage.automationLevelPct}%
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 tabular-nums">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Process Maturity
                </p>
                <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
                  L{activeStage.maturityScore} / 5
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Standardization
                </p>
                <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
                  L{activeStage.standardizationScore} / 5
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Control Strength
                </p>
                <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
                  L{activeStage.controlEffectivenessScore} / 5
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Peer Benchmark
                </p>
                <p className="mt-1 font-mono text-base font-extrabold text-teal-800">
                  {activeStage.benchmarkMaturityScore.toFixed(1)} / 5
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 sm:col-span-2">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">
                  12-Month Target Maturity
                </p>
                <p className="mt-1 font-mono text-base font-extrabold text-emerald-950">
                  {MATURITY_LEVEL_META[activeStage.targetMaturityScore].label}
                </p>
              </div>
            </div>
          </div>

          {/* Linked KPIs, Opportunities & Evidence for Active Stage */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Stage KPIs ({linkedKpis.length})
              </h4>
              <div className="mt-2 space-y-1.5">
                {linkedKpis.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => openKpiDrilldown(k.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-slate-900"
                  >
                    <span className="font-semibold text-slate-800">{k.name}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {k.formattedClient}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Improvement Opportunities ({linkedOpps.length})</span>
              </h4>
              <div className="mt-2 space-y-1.5">
                {linkedOpps.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() =>
                      openDrilldown({ type: "opportunity", opportunityId: o.id })
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-slate-900"
                  >
                    <span className="font-semibold text-slate-900">
                      {o.code}: {o.name}
                    </span>
                    <span className="ml-2 shrink-0 font-mono font-bold text-emerald-700">
                      +${(o.estimatedAnnualBenefitUsd / 1000).toFixed(0)}k/yr
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <Database className="h-3.5 w-3.5 text-slate-600" />
                <span>Supporting Evidence ({linkedDatasets.length})</span>
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {linkedDatasets.map((ds) => (
                  <span
                    key={ds.id}
                    className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {ds.datasetType} ({ds.records.toLocaleString()} rows)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
