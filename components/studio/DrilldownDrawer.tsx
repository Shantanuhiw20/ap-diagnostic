"use client";

import React from "react";
import {
  X,
  ArrowRight,
  Database,
  GitBranch,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calculator,
  TrendingUp,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";

export function DrilldownDrawer() {
  const {
    drilldown,
    closeDrilldown,
    kpiBenchmarks,
    processStages,
    rootCauses,
    opportunities,
    datasets,
    navigateTo,
    openDrilldown,
    toggleOpportunityRoadmap,
    updateProcessStage,
  } = useStudio();

  if (!drilldown) return null;

  if (drilldown.type === "kpi") {
    const kpi = kpiBenchmarks.find((k) => k.id === drilldown.kpiId);
    if (!kpi) return null;

    const linkedRcs = rootCauses.filter((r) => kpi.linkedRootCauseIds.includes(r.id));
    const linkedOpps = opportunities.filter((o) =>
      kpi.linkedOpportunityIds.includes(o.id),
    );
    const linkedDs = datasets.filter((d) => kpi.linkedDatasetIds.includes(d.id));
    const linkedStages = processStages.filter((s) =>
      kpi.linkedStageIds.includes(s.id),
    );

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close drill-down drawer"
          onClick={closeDrilldown}
          className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
        />
        <div className="animate-slide-in relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#0D1B2E] px-6 py-5 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[11px] font-bold tracking-wider text-slate-950 uppercase">
                  KPI Decision Intelligence
                </span>
                <span className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  {kpi.classification}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">{kpi.name}</h2>
              <p className="mt-0.5 text-xs text-slate-300">{kpi.dataSource}</p>
            </div>
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* 4-Column Benchmark Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Client Baseline</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                  {kpi.formattedClient}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
                  {kpi.formattedGapVsPeer}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Peer Benchmark</p>
                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
                  {kpi.peerBenchmark} <span className="text-xs font-normal">{kpi.unit}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">Target Cohort</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Industry Median</p>
                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
                  {kpi.industryBenchmark} <span className="text-xs font-normal">{kpi.unit}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">Manufacturing</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
                <p className="text-xs font-medium text-emerald-800">Best-in-Class</p>
                <p className="mt-1 text-lg font-bold text-emerald-950 tabular-nums">
                  {kpi.bestInClassBenchmark}{" "}
                  <span className="text-xs font-normal">{kpi.unit}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700">Top Quartile</p>
              </div>
            </div>

            {/* Formula & Financial Stake */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-700 uppercase">
                  <Calculator className="h-4 w-4 text-slate-600" />
                  <span>Deterministic Formula</span>
                </div>
                <p className="mt-1.5 font-mono text-xs text-slate-800">{kpi.formula}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-800 uppercase">
                  <TrendingUp className="h-4 w-4 text-amber-700" />
                  <span>Addressable Annual Value</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                  ${kpi.potentialFinancialImpactUsd.toLocaleString()} / yr
                </p>
                <p className="text-xs text-slate-600">
                  Modelled in Value Realization Engine
                </p>
              </div>
            </div>

            {/* Business Interpretation (WHAT & WHY) */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                1. What Is Happening &amp; Business Implication
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                {kpi.businessInterpretation}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Recommended Transformation Action
                </h4>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {kpi.improvementOpportunity}
                </p>
              </div>
            </div>

            {/* Underlying Root Causes (WHY) */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-600 uppercase">
                  <GitBranch className="h-4 w-4 text-slate-700" />
                  <span>2. Underlying Root Causes ({linkedRcs.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    closeDrilldown();
                    navigateTo("root-causes");
                  }}
                  className="text-xs font-semibold text-slate-700 underline hover:text-slate-950"
                >
                  Open Root Cause Workspace →
                </button>
              </div>
              <div className="space-y-2.5">
                {linkedRcs.map((rc) => (
                  <div
                    key={rc.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:border-slate-400"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {rc.code} · {rc.category}
                      </span>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                        {rc.severity} · ${(rc.estimatedAnnualImpactUsd / 1000).toFixed(0)}k/yr
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{rc.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{rc.rootCauseStatement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Opportunities (WHAT CAN BE DONE) */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-600 uppercase">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>3. Linked Automation &amp; AI Opportunities ({linkedOpps.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    closeDrilldown();
                    navigateTo("opportunities");
                  }}
                  className="text-xs font-semibold text-slate-700 underline hover:text-slate-950"
                >
                  Open Opportunity Catalog →
                </button>
              </div>
              <div className="space-y-2.5">
                {linkedOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5"
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {opp.code}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {opp.automationType}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 tabular-nums">
                          +${(opp.estimatedAnnualBenefitUsd / 1000).toFixed(0)}k/yr
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{opp.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleOpportunityRoadmap(opp.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                        opp.includeInRoadmap
                          ? "bg-slate-900 text-[#FFE600]"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {opp.includeInRoadmap ? "✓ In Roadmap" : "+ Add to Roadmap"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Stages & Evidence */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase">
                  <Layers className="h-4 w-4" />
                  <span>Affected Process Stages</span>
                </h4>
                <div className="mt-2.5 space-y-1.5">
                  {linkedStages.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => openDrilldown({ type: "stage", stageId: st.id })}
                      className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 hover:border-slate-400"
                    >
                      <span>
                        {st.order}. {st.name}
                      </span>
                      <span className="font-mono font-bold text-slate-600">
                        L{st.maturityScore}/5
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase">
                  <Database className="h-4 w-4" />
                  <span>Supporting Evidence Datasets</span>
                </h4>
                <div className="mt-2.5 space-y-1.5">
                  {linkedDs.map((ds) => (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => {
                        closeDrilldown();
                        navigateTo("data");
                      }}
                      className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 hover:border-slate-400"
                    >
                      <span className="truncate">{ds.datasetType}</span>
                      <span className="ml-2 shrink-0 font-mono text-[11px] text-slate-500">
                        {ds.records.toLocaleString()} rows
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  closeDrilldown();
                  navigateTo("benchmarks");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-90"
              >
                <span>Compare in Benchmark Analysis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (drilldown.type === "stage") {
    const stage = processStages.find((s) => s.id === drilldown.stageId);
    if (!stage) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close process stage drawer"
          onClick={closeDrilldown}
          className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
        />
        <div className="animate-slide-in relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#0D1B2E] px-6 py-5 text-white">
            <div>
              <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[11px] font-bold tracking-wider text-slate-950 uppercase">
                Stage {stage.order} of 12 · Process Assessment
              </span>
              <h2 className="mt-2 text-xl font-bold text-white">{stage.name}</h2>
              <p className="mt-0.5 text-xs text-slate-300">Owner: {stage.processOwner}</p>
            </div>
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <p className="text-sm text-slate-700">{stage.description}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Current Maturity (1–5)
                </label>
                <select
                  value={stage.maturityScore}
                  onChange={(e) =>
                    updateProcessStage(stage.id, {
                      maturityScore: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                    })
                  }
                  className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900"
                >
                  <option value={1}>Level 1 — Ad hoc</option>
                  <option value={2}>Level 2 — Developing</option>
                  <option value={3}>Level 3 — Standardized</option>
                  <option value={4}>Level 4 — Optimized</option>
                  <option value={5}>Level 5 — Intelligent</option>
                </select>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Automation Level (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={stage.automationLevelPct}
                  onChange={(e) =>
                    updateProcessStage(stage.id, {
                      automationLevelPct: Math.min(100, Math.max(0, Number(e.target.value))),
                    })
                  }
                  className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Peer Benchmark Score
                </label>
                <p className="mt-2 text-lg font-extrabold text-slate-900">
                  {stage.benchmarkMaturityScore.toFixed(1)} / 5.0
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Current-State Workflow
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                {stage.currentStateWorkflow}
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-900 uppercase">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span>Identified Pain Points</span>
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {stage.painPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Systems &amp; Controls
                </h4>
                <p className="mt-1.5 text-xs font-semibold text-slate-800">
                  Systems: {stage.systemsInvolved.join(", ")}
                </p>
                <p className="mt-1.5 text-xs text-slate-600">
                  Controls: {stage.controls.join(" · ")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Activities &amp; Roles
                </h4>
                <p className="mt-1.5 text-xs font-semibold text-slate-800">
                  Roles: {stage.roles.join(", ")}
                </p>
                <p className="mt-1.5 text-xs text-slate-600">
                  Activities: {stage.activities.join(" · ")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                closeDrilldown();
                navigateTo("process");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-90"
            >
              <span>Open Full Process Assessment</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (drilldown.type === "opportunity") {
    const opp = opportunities.find((o) => o.id === drilldown.opportunityId);
    if (!opp) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close opportunity drawer"
          onClick={closeDrilldown}
          className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
        />
        <div className="animate-slide-in relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#0D1B2E] px-6 py-5 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[11px] font-bold text-slate-950 uppercase">
                  {opp.code} · {opp.automationType}
                </span>
                <span className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  {opp.aiApplicability}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">{opp.name}</h2>
            </div>
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
                <p className="text-xs font-medium text-emerald-800">Estimated Annual Value</p>
                <p className="mt-1 text-lg font-extrabold text-emerald-950 tabular-nums">
                  ${opp.estimatedAnnualBenefitUsd.toLocaleString()}/yr
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Implementation Cost</p>
                <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                  ${opp.estimatedImplementationCostUsd.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Effort &amp; Complexity</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {opp.effortWeeks} wks · {opp.complexityLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Current State
                </h4>
                <p className="mt-1.5 text-sm text-slate-800">{opp.currentStateDetail}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <h4 className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                  Future State
                </h4>
                <p className="mt-1.5 text-sm text-slate-900">{opp.futureStateDetail}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Solution Architecture &amp; Implementation Approach
              </h4>
              <p className="mt-1.5 font-mono text-xs font-semibold text-slate-900">
                {opp.solutionArchitecture}
              </p>
              <p className="mt-2 text-sm text-slate-700">{opp.implementationApproach}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Required Capabilities &amp; Data
                </h4>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-700">
                  {opp.requiredCapabilities.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Risk &amp; Technology Considerations
                </h4>
                <p className="mt-1.5 text-xs text-slate-700">{opp.technologyConsiderations}</p>
                <p className="mt-1.5 text-xs text-amber-800">Risk: {opp.riskConsiderations}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Target Success Measurement
              </h4>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{opp.targetSuccessMetric}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={closeDrilldown}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => toggleOpportunityRoadmap(opp.id)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                opp.includeInRoadmap
                  ? "bg-slate-900 text-[#FFE600]"
                  : "bg-[#FFE600] text-slate-950"
              }`}
            >
              {opp.includeInRoadmap
                ? "✓ Included in Transformation Roadmap"
                : "+ Add Opportunity to Roadmap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
