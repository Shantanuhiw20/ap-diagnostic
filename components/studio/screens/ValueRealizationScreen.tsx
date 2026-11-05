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
  ComposedChart,
  Line,
} from "recharts";
import {
  Sliders,
  ShieldCheck,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { ValueScenario } from "@/lib/studio/types";
import { DiagnosticGate } from "../DiagnosticGate";

const COMPOSITION_COLORS = [
  "#0D1B2E",
  "#0F8B8D",
  "#EAB308",
  "#334155",
  "#10B981",
];

export function ValueRealizationScreen() {
  const {
    valueAssumptions,
    activeScenario,
    valueSummary,
    coreMetrics,
    datasets,
    updateValueAssumptions,
    setActiveScenario,
    navigateTo,
  } = useStudio();

  if (coreMetrics.answeredCount === 0 && datasets.length === 0) {
    return (
      <DiagnosticGate
        screenTitle="CFO Value Realization & Business Case"
        description="The deterministic 8-lever financial model requires baseline volume, FTE headcount, exception rate, touchless rate, and discount capture inputs. Capture responses in the Diagnostic Interview first."
      />
    );
  }

  const compositionData = [
    { name: "Hard Savings", value: valueSummary.hardSavingsAnnualUsd },
    { name: "Discount Capture", value: valueSummary.discountBenefitsAnnualUsd },
    { name: "Cost Avoidance", value: valueSummary.costAvoidanceAnnualUsd },
    { name: "Capacity Released", value: valueSummary.capacityReleasedAnnualUsd },
    {
      name: "Working Capital Financing",
      value: valueSummary.workingCapitalFinancingAnnualUsd,
    },
  ];

  const waterfallData = valueSummary.categories.map((c) => ({
    name: c.name.replace(/^\d+\.\s*/, "").slice(0, 22),
    value: Math.round(c.annualValueUsd / 1000),
    type: c.benefitType,
  }));

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE VALUE SUMMARY & SCENARIO SELECTOR */}
      <div className="rounded-xl border border-slate-200 bg-[#0D1B2E] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#FFE600] px-2.5 py-0.5 text-[11px] font-extrabold text-slate-950 uppercase">
                Deterministic Economic Model · Zero Double-Counting
              </span>
              <span className="rounded border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Active Scenario: {activeScenario}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-white">
              Value Realization &amp; Benefits Business Case
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              Separates Hard Savings, Discount Capture, Cost Avoidance, Capacity Released ({valueSummary.releasedFtes} FTEs), and Working Capital Release ($
              {(valueSummary.oneTimeWorkingCapitalReleaseUsd / 1000).toFixed(0)}k balance-sheet cash).
            </p>
          </div>

          {/* Scenario Toggle */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-1">
            {(["Conservative", "Base Case", "Optimistic"] as ValueScenario[]).map(
              (sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setActiveScenario(sc)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                    activeScenario === sc
                      ? "bg-[#FFE600] text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {sc}
                </button>
              ),
            )}
          </div>
        </div>

        {/* 5 Headline Financial KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 tabular-nums">
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <p className="text-[11px] font-medium text-slate-400">
              Gross Annual Benefit
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#FFE600]">
              ${valueSummary.grossAnnualBenefitUsd.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Across 8 value levers</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <p className="text-[11px] font-medium text-slate-400">
              Net Annual Run-Rate
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400">
              ${valueSummary.netAnnualBenefitUsd.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Less ${(valueSummary.recurringTechCostAnnualUsd / 1000).toFixed(0)}k/yr opex
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <p className="text-[11px] font-medium text-slate-400">
              Payback Period
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {valueSummary.paybackMonths} mos
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              On ${(valueSummary.implementationCostUsd / 1000).toFixed(0)}k investment
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <p className="text-[11px] font-medium text-slate-400">
              3-Year Net Benefit
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              ${valueSummary.threeYearNetBenefitUsd.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-300">
              3-Year ROI: {valueSummary.roiPct}%
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <p className="text-[11px] font-medium text-slate-400">
              1-Time Working Capital
            </p>
            <p className="mt-1 text-2xl font-extrabold text-sky-300">
              ${valueSummary.oneTimeWorkingCapitalReleaseUsd.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              +{valueAssumptions.dpoImprovementDays}d DPO cash release
            </p>
          </div>
        </div>
      </div>

      {/* 2. EDITABLE ASSUMPTIONS ENGINE + WATERFALL & COMPOSITION CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Editable Model Inputs (5 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-800" />
              <h2 className="text-sm font-bold text-slate-900">
                Editable Financial &amp; Operational Assumptions
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">
              Live Recalculation
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 tabular-nums">
            <AssumptionInput
              label="Annual Invoice Volume"
              value={valueAssumptions.annualInvoiceVolume}
              step={6000}
              onChange={(v) => updateValueAssumptions({ annualInvoiceVolume: v })}
            />
            <AssumptionInput
              label="AP Headcount (FTEs)"
              value={valueAssumptions.apHeadcount}
              step={1}
              onChange={(v) => updateValueAssumptions({ apHeadcount: v })}
            />
            <AssumptionInput
              label="Loaded FTE Cost ($/yr)"
              value={valueAssumptions.avgAnnualEmployeeCostUsd}
              step={2000}
              onChange={(v) =>
                updateValueAssumptions({ avgAnnualEmployeeCostUsd: v })
              }
            />
            <AssumptionInput
              label="Cost per Invoice ($)"
              value={valueAssumptions.costPerInvoiceUsd}
              step={0.5}
              onChange={(v) => updateValueAssumptions({ costPerInvoiceUsd: v })}
            />
            <AssumptionInput
              label="Current Touchless Rate (%)"
              value={valueAssumptions.currentAutomationRatePct}
              step={2}
              onChange={(v) =>
                updateValueAssumptions({ currentAutomationRatePct: v })
              }
            />
            <AssumptionInput
              label="Target Touchless Rate (%)"
              value={valueAssumptions.targetAutomationRatePct}
              step={2}
              onChange={(v) =>
                updateValueAssumptions({ targetAutomationRatePct: v })
              }
            />
            <AssumptionInput
              label="Current Exception Rate (%)"
              value={valueAssumptions.exceptionRatePct}
              step={1}
              onChange={(v) => updateValueAssumptions({ exceptionRatePct: v })}
            />
            <AssumptionInput
              label="Target Exception Rate (%)"
              value={valueAssumptions.targetExceptionRatePct}
              step={1}
              onChange={(v) =>
                updateValueAssumptions({ targetExceptionRatePct: v })
              }
            />
            <AssumptionInput
              label="Exception Handling Cost ($)"
              value={valueAssumptions.avgExceptionHandlingCostUsd}
              step={1}
              onChange={(v) =>
                updateValueAssumptions({ avgExceptionHandlingCostUsd: v })
              }
            />
            <AssumptionInput
              label="Eligible Discount Spend ($)"
              value={valueAssumptions.eligibleDiscountSpendUsd}
              step={500000}
              onChange={(v) =>
                updateValueAssumptions({ eligibleDiscountSpendUsd: v })
              }
            />
            <AssumptionInput
              label="Current Discount Capture (%)"
              value={valueAssumptions.discountCaptureRatePct}
              step={2}
              onChange={(v) =>
                updateValueAssumptions({ discountCaptureRatePct: v })
              }
            />
            <AssumptionInput
              label="Target Discount Capture (%)"
              value={valueAssumptions.targetDiscountCaptureRatePct}
              step={2}
              onChange={(v) =>
                updateValueAssumptions({ targetDiscountCaptureRatePct: v })
              }
            />
            <AssumptionInput
              label="Implementation Investment ($)"
              value={valueAssumptions.implementationCostUsd}
              step={10000}
              onChange={(v) =>
                updateValueAssumptions({ implementationCostUsd: v })
              }
            />
            <AssumptionInput
              label="Annual Recurring Tech ($/yr)"
              value={valueAssumptions.recurringTechCostAnnualUsd}
              step={5000}
              onChange={(v) =>
                updateValueAssumptions({ recurringTechCostAnnualUsd: v })
              }
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Non-Double-Counting Accounting Rule</span>
            </p>
            <p className="mt-1">
              Category 1 models FTE time released from manual indexing, while Category 2 models strictly non-labor overhead (mailroom, paper, check printing, archive). Labor savings are never counted twice.
            </p>
          </div>
        </div>

        {/* Right: Charts (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Benefit Waterfall Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Annual Benefit Contribution by Lever ($k / yr — {activeScenario})
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown across all 8 Finance Transformation benefit levers
            </p>
            <div className="mt-3 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={waterfallData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="k" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val) => [`$${val}k / yr`, "Annual Benefit"]}
                  />
                  <Bar
                    dataKey="value"
                    name="Annual Benefit ($k)"
                    fill="#0D1B2E"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Benefit Composition & 3-Year Realization Trajectory */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Benefit Composition Pie */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Benefit Classification Split
              </h3>
              <p className="text-xs text-slate-500">
                Hard Savings vs. Discounts vs. Avoidance vs. Capacity
              </p>
              <div className="mt-2 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={66}
                      paddingAngle={3}
                    >
                      {compositionData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={COMPOSITION_COLORS[idx % COMPOSITION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [
                        `$${Number(val).toLocaleString()}/yr`,
                        "Value",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-xs">
                {compositionData.map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{
                          backgroundColor:
                            COMPOSITION_COLORS[idx % COMPOSITION_COLORS.length],
                        }}
                      />
                      {c.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      ${(c.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-Year Cash Flow & Cumulative Net Value */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Three-Year Value Realization Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Gross benefit vs. investment &amp; cumulative net cash flow
              </p>
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={valueSummary.threeYearTimeline}
                    margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val) => `$${Number(val).toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="grossBenefit"
                      name="Gross Benefit"
                      fill="#0F8B8D"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeNet"
                      name="Cumulative Net Value"
                      stroke="#0D1B2E"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRANSPARENT 8-LEVER FORMULA TABLE & SCENARIO COMPARISON */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Calculator className="h-4 w-4 text-slate-800" />
              <span>Transparent Benefit Calculation Ledger (All 8 Levers)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Every figure shows its exact deterministic formula and input arithmetic for CFO auditability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo("roadmap")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-extrabold text-slate-950 hover:opacity-90"
          >
            <span>Sequence in Transformation Roadmap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                <th className="px-3.5 py-2.5 font-bold">Benefit Category</th>
                <th className="px-3.5 py-2.5 font-bold">Classification</th>
                <th className="px-3.5 py-2.5 font-bold">Deterministic Formula</th>
                <th className="px-3.5 py-2.5 font-bold">Live Arithmetic</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Annual Value ($/yr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {valueSummary.categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-3 font-bold text-slate-900">
                    {cat.name}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                      {cat.benefitType}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[11px] text-slate-600">
                    {cat.formulaText}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">
                    {cat.calculationDetail}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-extrabold text-emerald-700">
                    ${cat.annualValueUsd.toLocaleString()}
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

function AssumptionInput({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
      />
    </div>
  );
}
