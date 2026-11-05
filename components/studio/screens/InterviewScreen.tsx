"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Bot,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Zap,
  TrendingUp,
  Sliders,
  Clock,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { INTERVIEW_CATEGORIES } from "@/lib/studio/seed-data";
import type { KpiId } from "@/lib/studio/types";

export function InterviewScreen() {
  const {
    questions,
    processStages,
    rootCauses,
    activeInterviewCategoryId,
    activeQuestionId,
    coreMetrics,
    valueSummary,
    setActiveInterviewCategory,
    setActiveQuestion,
    updateQuestionAnswer,
    fillCategoryDemoAnswers,
    clearAllInterviewAnswers,
    loadCompletedDemoBaseline,
    openKpiDrilldown,
    navigateTo,
  } = useStudio();

  const currentQuestion = useMemo(
    () =>
      questions.find((q) => q.id === activeQuestionId) ??
      questions.find((q) => q.categoryId === activeInterviewCategoryId) ??
      questions[0],
    [questions, activeQuestionId, activeInterviewCategoryId],
  );

  const draftAnswer = currentQuestion?.answer ?? "";
  const draftNotes = currentQuestion?.notes ?? "";

  const handleSelectQuestion = (qId: string) => {
    setActiveQuestion(qId);
  };

  const handleSelectCategory = (catId: string) => {
    setActiveInterviewCategory(catId);
  };

  const currentIndex = questions.findIndex((q) => q.id === currentQuestion.id);
  const categoryQuestions = questions.filter(
    (q) => q.categoryId === currentQuestion.categoryId,
  );
  const answeredTotal = questions.filter((q) => q.status === "answered").length;
  const progressPct =
    questions.length > 0 ? Math.round((answeredTotal / questions.length) * 100) : 0;

  // Calculate live unlocked value case proportional to answered questions
  const unlockedValueUsd = useMemo(() => {
    if (answeredTotal === 0) return 0;
    if (answeredTotal === questions.length) return valueSummary.grossAnnualBenefitUsd;
    const sumFromAnswered = questions
      .filter((q) => q.status === "answered")
      .reduce((acc, q) => acc + (q.valueUnlockedUsd ?? 45000), 0);
    return Math.min(valueSummary.grossAnnualBenefitUsd, sumFromAnswered);
  }, [answeredTotal, questions, valueSummary.grossAnnualBenefitUsd]);

  // Apply answer immediately when clicking a scenario card or option
  const handleInstantApply = (val: string, presetNotes?: string, silent?: boolean) => {
    const nextNotes = presetNotes ?? currentQuestion.demoNotes ?? draftNotes;
    updateQuestionAnswer(currentQuestion.id, val, nextNotes, { silent });
  };

  const handleConfirmAndNext = () => {
    const valToSave =
      draftAnswer.trim() ||
      currentQuestion.demoAnswer ||
      currentQuestion.suggestedAnswers[0] ||
      "";
    const notesToSave =
      draftNotes.trim() || currentQuestion.demoNotes || "";
    updateQuestionAnswer(currentQuestion.id, valToSave, notesToSave);

    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      setActiveQuestion(nextQ.id);
    } else {
      navigateTo("data");
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1];
      setActiveQuestion(prevQ.id);
    }
  };

  const handleClearCurrentAnswer = () => {
    updateQuestionAnswer(currentQuestion.id, "", "", { silent: true });
  };

  // Dynamic validation & control alerts — ONLY surface once the underlying question is answered!
  const validationWarnings = useMemo(() => {
    const warnings: Array<{ catId: string; severity: "critical" | "warning"; message: string }> = [];
    const isAns = (code: string) => coreMetrics.answeredFieldCodes.includes(code);

    if (isAns("ap_04") && isAns("ap_touchless") && coreMetrics.poBackedRate < 70 && coreMetrics.touchlessRate > 65) {
      warnings.push({
        catId: "technology-systems",
        severity: "critical",
        message: `Contradiction: Touchless rate (${coreMetrics.touchlessRate}%) exceeds PO-backed rate (${coreMetrics.poBackedRate}%). Non-PO invoices cannot post touchlessly without auto-coding rules.`,
      });
    }
    if (isAns("ap_04") && coreMetrics.poBackedRate < 75) {
      warnings.push({
        catId: "technology-systems",
        severity: "critical",
        message: `High Non-PO Spend (${100 - coreMetrics.poBackedRate}%): ${Math.round(coreMetrics.annualInvoices * ((100 - coreMetrics.poBackedRate) / 100)).toLocaleString()} invoices/yr bypass 3-way matching.`,
      });
    }
    if (isAns("ap_08") && coreMetrics.exceptionRate >= 15) {
      warnings.push({
        catId: "process-workflow",
        severity: "critical",
        message: `High Exception Rate (${coreMetrics.exceptionRate}%): ${Math.round(coreMetrics.annualInvoices * (coreMetrics.exceptionRate / 100)).toLocaleString()} reworks/yr (~3.0 FTEs consumed).`,
      });
    }
    if (isAns("ap_14") && coreMetrics.discountCaptureRate < 55) {
      warnings.push({
        catId: "performance-kpis",
        severity: "warning",
        message: `Cash Leakage: Only ${coreMetrics.discountCaptureRate}% of 2/10 Net 30 discounts captured (~$173.6k/yr forfeited in approval queues).`,
      });
    }
    const sodQ = questions.find((q) => q.id === "q_ctrl_01");
    if (sodQ?.status === "answered" && sodQ.answer.toLowerCase().includes("no independent")) {
      warnings.push({
        catId: "controls-compliance",
        severity: "critical",
        message: "Critical SoD Control Gap: AP processors hold unsegregated SAP vendor master creation & bank edit rights.",
      });
    }
    return warnings;
  }, [coreMetrics, questions]);

  const linkedStagesForQuestion = processStages.filter((s) =>
    currentQuestion.linkedStageIds.includes(s.id),
  );
  const linkedRcsForQuestion = rootCauses.filter((r) =>
    currentQuestion.linkedRootCauseIds.includes(r.id),
  );

  // Map each right-panel KPI to the question that unlocks it
  const liveKpiRows: Array<{
    id: KpiId;
    label: string;
    unlocked: boolean;
    questionId: string;
    questionLabel: string;
    val: string;
    peerText: string;
    status: "critical" | "warning" | "good";
  }> = [
    {
      id: "invoices_per_fte",
      label: "Invoices / FTE",
      unlocked:
        coreMetrics.answeredFieldCodes.includes("ap_03") &&
        coreMetrics.answeredFieldCodes.includes("ap_19"),
      questionId: !coreMetrics.answeredFieldCodes.includes("ap_03") ? "q_vol_01" : "q_wf_01",
      questionLabel: !coreMetrics.answeredFieldCodes.includes("ap_03") ? "Q3 (Volume)" : "Q4 (FTEs)",
      val: `${coreMetrics.invoicesPerFte.toLocaleString()}/yr`,
      peerText: "Peer: 36,000",
      status: coreMetrics.invoicesPerFte < 25000 ? "critical" : "good",
    },
    {
      id: "cost_per_invoice",
      label: "Unit Cost / Invoice",
      unlocked:
        coreMetrics.answeredFieldCodes.includes("ap_03") &&
        coreMetrics.answeredFieldCodes.includes("ap_19"),
      questionId: "q_wf_01",
      questionLabel: "Q4 (FTEs)",
      val: `$${coreMetrics.costPerInvoice.toFixed(2)}`,
      peerText: "Peer: $5.20",
      status: coreMetrics.costPerInvoice > 8 ? "critical" : "good",
    },
    {
      id: "po_backed_rate",
      label: "PO-Backed Share",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_04"),
      questionId: "q_vol_02",
      questionLabel: "Q5 (PO Split)",
      val: `${coreMetrics.poBackedRate}%`,
      peerText: "Peer: 85%",
      status: coreMetrics.poBackedRate < 75 ? "critical" : "good",
    },
    {
      id: "touchless_rate",
      label: "Touchless Rate",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_touchless"),
      questionId: "q_tech_02",
      questionLabel: "Q6 (Touchless)",
      val: `${coreMetrics.touchlessRate}%`,
      peerText: "Peer: 65%",
      status: coreMetrics.touchlessRate < 50 ? "critical" : "good",
    },
    {
      id: "exception_rate",
      label: "Exception Rate",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_08"),
      questionId: "q_proc_02",
      questionLabel: "Q8 (Exceptions)",
      val: `${coreMetrics.exceptionRate}%`,
      peerText: "Peer: 8%",
      status: coreMetrics.exceptionRate > 12 ? "critical" : "good",
    },
    {
      id: "cycle_time_days",
      label: "Avg Cycle Time",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_09"),
      questionId: "q_kpi_01",
      questionLabel: "Q9 (Cycle Time)",
      val: `${coreMetrics.cycleTimeDays.toFixed(1)} days`,
      peerText: "Peer: 3.8d",
      status: coreMetrics.cycleTimeDays > 5 ? "warning" : "good",
    },
    {
      id: "discount_capture_rate",
      label: "Discount Capture",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_14"),
      questionId: "q_kpi_04",
      questionLabel: "Q10 (Discounts)",
      val: `${coreMetrics.discountCaptureRate}%`,
      peerText: "Peer: 68%",
      status: coreMetrics.discountCaptureRate < 55 ? "critical" : "good",
    },
    {
      id: "vendor_query_rate",
      label: "Vendor Queries",
      unlocked: coreMetrics.answeredFieldCodes.includes("ap_17"),
      questionId: "q_wf_02",
      questionLabel: "Q11 (Queries)",
      val: `${coreMetrics.vendorQueryRatePer1k} / 1k inv`,
      peerText: "Peer: 35/1k",
      status: coreMetrics.vendorQueryRatePer1k > 50 ? "warning" : "good",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. PRESENTER DEMO COMMAND BAR */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1B2E] px-5 py-3.5 text-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-950 uppercase">
                  Live CFO Discovery Session
                </span>
                <span className="text-xs font-bold text-white">
                  {answeredTotal} of {questions.length} Questions Captured ({progressPct}%)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Click any <strong className="text-[#FFE600]">Harlow Actual (Demo Baseline)</strong> card below to populate the answer instantly, or adjust the slider/input live with the CFO.
              </p>
            </div>
          </div>

          {/* Presenter Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fillCategoryDemoAnswers(currentQuestion.categoryId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-[#FFE600] hover:text-white"
              title="Populate answers for the 2 questions in this category"
            >
              <Zap className="h-3.5 w-3.5 text-[#FFE600]" />
              <span>Fill Category (2 Qs)</span>
            </button>

            <button
              type="button"
              onClick={loadCompletedDemoBaseline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-2xs transition-opacity hover:opacity-90"
              title="Populate all 12 interview answers and 4 SAP datasets in one click"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Complete All (12/12)</span>
            </button>

            {answeredTotal > 0 && (
              <button
                type="button"
                onClick={clearAllInterviewAnswers}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-200 transition-colors hover:bg-red-900/60"
                title="Reset all interview answers back to 0%"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Answers (0%)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN INTERVIEW WORKSPACE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN (3 cols): 6 Executive Diagnostic Categories */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-3">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              6 Diagnostic Pillars (12 Qs)
            </span>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">
              Structured CFO Question Bank
            </h2>
          </div>

          <div className="flex-1 space-y-2">
            {INTERVIEW_CATEGORIES.map((cat) => {
              const catQs = questions.filter((q) => q.categoryId === cat.id);
              const answeredCount = catQs.filter((q) => q.status === "answered").length;
              const pct =
                catQs.length > 0 ? Math.round((answeredCount / catQs.length) * 100) : 0;
              const isSelected = currentQuestion.categoryId === cat.id;
              const catWarnings = validationWarnings.filter((w) => w.catId === cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-slate-900 bg-[#0D1B2E] text-white shadow-xs"
                      : "border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">
                      {cat.order}. {cat.name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                        isSelected
                          ? "bg-[#FFE600] text-slate-950"
                          : pct === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : pct > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {answeredCount}/{catQs.length}
                    </span>
                  </div>

                  <p
                    className={`mt-1 line-clamp-1 text-[11px] ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {cat.description}
                  </p>

                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200/30">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct === 100
                          ? "bg-emerald-400"
                          : isSelected
                            ? "bg-[#FFE600]"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {catWarnings.length > 0 && (
                    <div
                      className={`mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold ${
                        isSelected
                          ? "bg-amber-400/20 text-[#FFE600]"
                          : "bg-amber-100/80 text-amber-900"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{catWarnings[0].message}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN (6 cols): Interactive Question Entry Workspace */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs lg:col-span-6">
          {/* Question Stepper Header */}
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B2E] text-[#FFE600]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        currentQuestion.status === "answered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {currentQuestion.status === "answered" ? "✓ Answered" : "Awaiting Input"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Evidence Source: <strong className="text-slate-700">{currentQuestion.requiredEvidence}</strong>
                  </p>
                </div>
              </div>

              {currentQuestion.benchmarkHint && (
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
                  {currentQuestion.benchmarkHint}
                </span>
              )}
            </div>

            {/* Question Pills inside Current Category */}
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryQuestions.map((q) => {
                const globalIdx = questions.findIndex((item) => item.id === q.id);
                const isCurr = q.id === currentQuestion.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      isCurr
                        ? "bg-[#0D1B2E] text-[#FFE600] shadow-2xs"
                        : q.status === "answered"
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>Q{globalIdx + 1}:</span>
                    <span>{q.title}</span>
                    {q.status === "answered" && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Question Form Body */}
          <div className="flex-1 space-y-5 p-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                {currentQuestion.question}
              </h3>
              <p className="mt-2 rounded-lg border-l-4 border-[#FFE600] bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Why this matters to the CFO:</strong>{" "}
                {currentQuestion.contextExplanation}
              </p>
            </div>

            {/* 1. NUMERIC / PERCENTAGE INTERACTIVE INPUT + SLIDER */}
            {(currentQuestion.controlType === "number" ||
              currentQuestion.controlType === "percentage" ||
              currentQuestion.controlType === "currency") && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                      Enter Client Value {currentQuestion.unit ? `(${currentQuestion.unit})` : ""}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Type a value and press Enter, drag the sensitivity slider, or click a preset below:
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      step="any"
                      value={draftAnswer}
                      onChange={(e) => {
                        updateQuestionAnswer(
                          currentQuestion.id,
                          e.target.value,
                          draftNotes || currentQuestion.demoNotes,
                          { silent: true },
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmAndNext();
                        }
                      }}
                      placeholder={currentQuestion.demoAnswer ?? "0"}
                      className="w-36 rounded-lg border-2 border-slate-300 bg-white px-3.5 py-2 text-right font-mono text-xl font-extrabold text-slate-900 tabular-nums focus:border-slate-900 focus:ring-2 focus:ring-[#FFE600] focus:outline-none"
                    />
                    {currentQuestion.unit && (
                      <span className="rounded-md bg-slate-200/80 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800">
                        {currentQuestion.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Range Slider for Live Sensitivity */}
                {currentQuestion.sliderRange && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sliders className="h-3 w-3" />
                        <span>Live What-If Sensitivity Slider</span>
                      </span>
                      <span className="font-mono">
                        Range: {currentQuestion.sliderRange.min.toLocaleString()} –{" "}
                        {currentQuestion.sliderRange.max.toLocaleString()}{" "}
                        {currentQuestion.unit ?? ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={currentQuestion.sliderRange.min}
                      max={currentQuestion.sliderRange.max}
                      step={currentQuestion.sliderRange.step}
                      value={
                        draftAnswer !== "" && !Number.isNaN(Number(draftAnswer))
                          ? Number(draftAnswer)
                          : Number(currentQuestion.demoAnswer ?? currentQuestion.sliderRange.min)
                      }
                      onChange={(e) => {
                        handleInstantApply(e.target.value, undefined, true);
                      }}
                      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#0D1B2E]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. SELECT / OPERATING MODEL RADIO CARDS (Instant Apply on Click) */}
            {(currentQuestion.controlType === "select" ||
              currentQuestion.controlType === "yes-no") &&
              currentQuestion.options && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                    Select Client Operating Reality (Clicks Apply Immediately)
                  </label>
                  {currentQuestion.options.map((opt) => {
                    const isSelected = draftAnswer === opt;
                    const isDemoRecommended = currentQuestion.demoAnswer === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInstantApply(opt)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${
                          isSelected
                            ? "border-slate-900 bg-[#0D1B2E] font-bold text-white shadow-sm ring-2 ring-[#FFE600]"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-[#FFE600] bg-[#FFE600] font-extrabold text-slate-950"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isDemoRecommended && (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              isSelected
                                ? "bg-[#FFE600] text-slate-950"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            Harlow Demo Baseline
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            {/* 3. ONE-CLICK SCENARIO PRESET CARDS */}
            {currentQuestion.scenarioPresets &&
              currentQuestion.scenarioPresets.length > 0 &&
              currentQuestion.controlType !== "select" && (
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                    One-Click Demo Presets (Click to Populate &amp; Sync Model)
                  </span>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {currentQuestion.scenarioPresets.map((preset) => {
                      const isActive = draftAnswer === preset.value;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleInstantApply(preset.value, preset.notes)}
                          className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                            isActive
                              ? "border-slate-900 bg-[#0D1B2E] text-white shadow-sm ring-2 ring-[#FFE600]"
                              : preset.isClientBaseline
                                ? "border-amber-300 bg-amber-50/60 text-slate-900 hover:border-slate-900 hover:bg-amber-100/70"
                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[10px] font-extrabold uppercase ${
                                  isActive
                                    ? "text-[#FFE600]"
                                    : preset.isClientBaseline
                                      ? "text-amber-900"
                                      : "text-slate-500"
                                }`}
                              >
                                {preset.label}
                              </span>
                              {isActive && (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
                              )}
                            </div>
                            <p className="mt-1 font-mono text-lg font-extrabold tabular-nums">
                              {Number(preset.value).toLocaleString()}
                              {currentQuestion.unit === "%" ? "%" : ` ${currentQuestion.unit ?? ""}`}
                            </p>
                          </div>
                          <p
                            className={`mt-1.5 text-[11px] leading-snug ${
                              isActive ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {preset.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* 4. LIVE DIAGNOSTIC SIGNAL & CAUSAL IMPACT PREVIEW (Appears once answered!) */}
            {currentQuestion.status === "answered" && currentQuestion.impactPreview && (
              <div className="animate-message-in rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-emerald-950 uppercase">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    <span>Live Diagnostic Signal Captured</span>
                  </span>
                  {currentQuestion.valueUnlockedUsd && (
                    <span className="rounded-md bg-emerald-800 px-2.5 py-0.5 font-mono text-xs font-bold text-[#FFE600]">
                      +${(currentQuestion.valueUnlockedUsd / 1000).toFixed(1)}k/yr Value Lever Linked
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed font-medium text-slate-800">
                  {currentQuestion.impactPreview}
                </p>
              </div>
            )}

            {/* 5. CONSULTANT FIELD NOTES & FOLLOW-UP PROBE */}
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
                  Consultant Field Notes &amp; CFO Discussion Probe
                </label>
                <span className="text-[11px] text-slate-500 italic">
                  Probe: &ldquo;{currentQuestion.followUpPrompt}&rdquo;
                </span>
              </div>
              <textarea
                rows={2}
                value={draftNotes}
                onChange={(e) => {
                  updateQuestionAnswer(
                    currentQuestion.id,
                    draftAnswer,
                    e.target.value,
                    { silent: true },
                  );
                }}
                placeholder="Document plant-specific observations or CFO commentary…"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Question Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentQuestion.status === "answered" && (
                <button
                  type="button"
                  onClick={handleClearCurrentAnswer}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Answer</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmAndNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D1B2E] px-4 py-2 text-xs font-extrabold text-[#FFE600] shadow-xs transition-colors hover:bg-slate-800"
              >
                <span>
                  {draftAnswer.trim()
                    ? currentIndex < questions.length - 1
                      ? "Confirm & Next Question"
                      : "Complete Interview & Verify ERP Data"
                    : "Apply Demo Baseline & Next"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (3 cols): Live Diagnostic Telemetry */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* 1. Live Value Case Counter */}
          <div className="rounded-xl border border-slate-800 bg-[#0D1B2E] p-4 text-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                <TrendingUp className="h-3.5 w-3.5 text-[#FFE600]" />
                <span>Live Value Case Unlocked</span>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                {progressPct}% Modelled
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-extrabold text-[#FFE600] tabular-nums">
              ${unlockedValueUsd.toLocaleString()}
              <span className="text-xs font-normal text-slate-400"> / yr</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {answeredTotal === 0
                ? "Enter answers to quantify annual savings across 8 levers"
                : `Plus $${(valueSummary.oneTimeWorkingCapitalReleaseUsd / 1000).toFixed(0)}k 1-time working capital cash release`}
            </p>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-[#FFE600] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 2. Live Extracted KPIs (Lights up progressively as questions are answered) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Live Extracted KPIs
              </h3>
              <span className="font-mono text-[10px] font-semibold text-slate-400">
                {liveKpiRows.filter((r) => r.unlocked).length}/8 Active
              </span>
            </div>
            <div className="mt-2 divide-y divide-slate-100 text-xs">
              {liveKpiRows.map((item) =>
                item.unlocked ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openKpiDrilldown(item.id)}
                    className="flex w-full items-center justify-between py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400">
                        ({item.peerText})
                      </span>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-xs font-extrabold tabular-nums ${
                        item.status === "critical"
                          ? "bg-red-50 text-red-700"
                          : item.status === "warning"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {item.val}
                    </span>
                  </button>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectQuestion(item.questionId)}
                    className="flex w-full items-center justify-between py-2 text-left text-slate-400 transition-colors hover:text-slate-700"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="inline-flex items-center gap-1 rounded border border-dashed border-slate-300 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      <span>Answer {item.questionLabel}</span>
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* 3. Identified Risks & Contradiction Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Live Diagnostic Alerts ({validationWarnings.length})</span>
            </h3>
            {validationWarnings.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                No risks triggered yet. As you enter client responses for PO split, exceptions, discounts, and controls, real-time audit alerts will appear here.
              </p>
            ) : (
              <div className="mt-2.5 space-y-2">
                {validationWarnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-2.5 text-xs ${
                      w.severity === "critical"
                        ? "border-red-200 bg-red-50/70 text-red-950"
                        : "border-amber-200 bg-amber-50/70 text-slate-800"
                    }`}
                  >
                    {w.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Active Question Causal Traceability */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-slate-900" />
              <span>Downstream Story Linkage</span>
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              {linkedStagesForQuestion.length > 0 && (
                <p>
                  <strong className="text-slate-900">Impacted Process Stages:</strong>{" "}
                  {linkedStagesForQuestion.map((s) => s.shortName).join(", ")}
                </p>
              )}
              {linkedRcsForQuestion.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-900">Linked Root Causes:</span>
                  {linkedRcsForQuestion.map((rc) => (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => navigateTo("root-causes")}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-800 hover:border-slate-900"
                    >
                      <span className="font-mono font-bold text-slate-950">{rc.code}:</span>{" "}
                      {rc.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
