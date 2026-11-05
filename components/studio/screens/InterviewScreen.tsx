"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Bot,
  Paperclip,
  ArrowLeft,
  ArrowRight,
  Save,
  SkipForward,
  Sparkles,
  ShieldAlert,
  Database,
  MessageSquare,
  Send,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { INTERVIEW_CATEGORIES } from "@/lib/studio/seed-data";

export function InterviewScreen() {
  const {
    clientName,
    questions,
    datasets,
    processStages,
    rootCauses,
    activeInterviewCategoryId,
    activeQuestionId,
    coreMetrics,
    setActiveInterviewCategory,
    setActiveQuestion,
    updateQuestionAnswer,
    skipQuestion,
    toggleDatasetOnQuestion,
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

  const [draftAnswer, setDraftAnswer] = useState(currentQuestion?.answer ?? "");
  const [draftNotes, setDraftNotes] = useState(currentQuestion?.notes ?? "");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLog, setCopilotLog] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    {
      role: "assistant",
      text: `Structured Diagnostic Assistant active for ${clientName}. I cross-check your responses across all 8 categories against uploaded datasets (DS-01 to DS-06) and highlight causal linkages or contradictions in real time.`,
    },
  ]);

  // Sync draft state when user switches questions
  const handleSelectQuestion = (qId: string) => {
    const target = questions.find((q) => q.id === qId);
    if (target) {
      setDraftAnswer(target.answer);
      setDraftNotes(target.notes ?? "");
      setActiveQuestion(qId);
    }
  };

  const handleSelectCategory = (catId: string) => {
    setActiveInterviewCategory(catId);
    const firstQ = questions.find((q) => q.categoryId === catId);
    if (firstQ) {
      setDraftAnswer(firstQ.answer);
      setDraftNotes(firstQ.notes ?? "");
    }
  };

  const currentIndex = questions.findIndex((q) => q.id === currentQuestion.id);
  const categoryQuestions = questions.filter(
    (q) => q.categoryId === currentQuestion.categoryId,
  );

  const handleSaveCurrent = () => {
    updateQuestionAnswer(currentQuestion.id, draftAnswer, draftNotes);
  };

  const handleNextQuestion = () => {
    updateQuestionAnswer(currentQuestion.id, draftAnswer, draftNotes);
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      setDraftAnswer(nextQ.answer);
      setDraftNotes(nextQ.notes ?? "");
      setActiveQuestion(nextQ.id);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1];
      setDraftAnswer(prevQ.answer);
      setDraftNotes(prevQ.notes ?? "");
      setActiveQuestion(prevQ.id);
    }
  };

  // Detect any cross-field analytical warnings or contradictions
  const validationWarnings = useMemo(() => {
    const warnings: Array<{ catId: string; message: string }> = [];
    if (coreMetrics.poBackedRate < 70 && coreMetrics.touchlessRate > 65) {
      warnings.push({
        catId: "technology-systems",
        message: `Contradiction: Touchless rate (${coreMetrics.touchlessRate}%) exceeds PO-backed rate (${coreMetrics.poBackedRate}%). Non-PO invoices rarely post touchlessly without auto-coding rules.`,
      });
    }
    if (coreMetrics.dpoDays >= 55 && coreMetrics.onTimePaymentRate < 75) {
      warnings.push({
        catId: "performance-kpis",
        message: `High DPO (${coreMetrics.dpoDays}d) paired with low On-Time Payment (${coreMetrics.onTimePaymentRate}%) indicates late payment rather than negotiated terms.`,
      });
    }
    const sodQ = questions.find((q) => q.id === "q_ctrl_01");
    if (sodQ?.answer.toLowerCase().includes("no independent")) {
      warnings.push({
        catId: "controls-compliance",
        message: "Critical SoD Control Finding: AP processors hold unsegregated vendor creation access.",
      });
    }
    const excQ = questions.find((q) => q.id === "q_proc_02");
    if (excQ && (excQ.numericValue ?? 0) >= 15) {
      warnings.push({
        catId: "process-workflow",
        message: `High Exception Rate (${excQ.answer}%): Above 15% threshold — AP is operating as a rework function.`,
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

  const handleCopilotAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = copilotInput.trim();
    if (!trimmed) return;
    const nextUser = { role: "user" as const, text: trimmed };

    // Deterministic contextual diagnostic response grounded in current question & metrics
    const replyText =
      `For **${currentQuestion.title}** (\`${currentQuestion.fieldCode}\`), ${clientName}'s recorded value is **${draftAnswer || "unanswered"}**. ` +
      `In our causal model, this directly impacts **${currentQuestion.linkedKpiId ?? "process maturity"}** and links to evidence **${currentQuestion.requiredEvidence}**. ` +
      `Follow-up to probe with the client: *"${currentQuestion.followUpPrompt}"*`;

    setCopilotLog((prev) => [...prev, nextUser, { role: "assistant", text: replyText }]);
    setCopilotInput("");
  };

  return (
    <div className="space-y-5">
      {/* Top 3-Column Interview Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN (3 cols): 8 Diagnostic Categories */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-3">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Diagnostic Categories (8)
            </span>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">
              Structured Question Bank
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
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                      {answeredCount} of {catQs.length} questions
                    </span>
                    <span
                      className={`font-semibold ${
                        pct === 100
                          ? isSelected
                            ? "text-emerald-300"
                            : "text-emerald-700"
                          : isSelected
                            ? "text-amber-300"
                            : "text-amber-700"
                      }`}
                    >
                      {pct === 100 ? "Completed" : "In Progress"}
                    </span>
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

        {/* CENTER COLUMN (6 cols): Structured Interview Workspace */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs lg:col-span-6">
          {/* AI Assistant Identity & Category Question Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B2E] text-[#FFE600]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      EY AP Diagnostic Intelligence Assistant
                    </span>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Live Model Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Question {currentIndex + 1} of {questions.length} · Field Code:{" "}
                    <code className="font-mono font-bold text-slate-700">
                      {currentQuestion.fieldCode}
                    </code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCopilotOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                <MessageSquare className="h-3.5 w-3.5 text-slate-700" />
                <span>{copilotOpen ? "Hide AI Copilot" : "Ask AI Copilot"}</span>
              </button>
            </div>

            {/* Question Pills inside Current Category */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categoryQuestions.map((q, idx) => {
                const isCurr = q.id === currentQuestion.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      isCurr
                        ? "bg-slate-900 text-[#FFE600]"
                        : q.status === "answered"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>Q{idx + 1}:</span>
                    <span className="max-w-[160px] truncate">{q.title}</span>
                    {q.status === "answered" && (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Question Form Body */}
          <div className="flex-1 space-y-5 p-6">
            <div>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 uppercase">
                {currentQuestion.title}
              </span>
              <h3 className="mt-2 text-lg font-extrabold text-slate-900 leading-snug">
                {currentQuestion.question}
              </h3>
              <p className="mt-2 rounded-lg border-l-4 border-[#FFE600] bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Why this matters:</strong>{" "}
                {currentQuestion.contextExplanation}
              </p>
            </div>

            {/* Structured Input Control based on controlType */}
            <div className="space-y-3">
              <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                Client Diagnostic Response{" "}
                {currentQuestion.unit ? `(${currentQuestion.unit})` : ""}
              </label>

              {(currentQuestion.controlType === "number" ||
                currentQuestion.controlType === "percentage" ||
                currentQuestion.controlType === "currency") && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="any"
                    value={draftAnswer}
                    onChange={(e) => setDraftAnswer(e.target.value)}
                    placeholder={`Enter ${currentQuestion.unit ?? "value"}…`}
                    className="w-56 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-extrabold text-slate-900 tabular-nums focus:border-slate-900 focus:ring-2 focus:ring-[#FFE600] focus:outline-none"
                  />
                  {currentQuestion.unit && (
                    <span className="text-sm font-bold text-slate-600">
                      {currentQuestion.unit}
                    </span>
                  )}
                </div>
              )}

              {(currentQuestion.controlType === "select" ||
                currentQuestion.controlType === "yes-no") &&
                currentQuestion.options && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          draftAnswer === opt
                            ? "border-slate-900 bg-amber-50/50 font-bold text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          checked={draftAnswer === opt}
                          onChange={() => setDraftAnswer(opt)}
                          className="h-4 w-4 accent-slate-900"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

              {(currentQuestion.controlType === "text" ||
                currentQuestion.controlType === "multi-select") && (
                <textarea
                  rows={3}
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  placeholder="Enter structured response…"
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-[#FFE600] focus:outline-none"
                />
              )}

              {/* Suggested Benchmarks / Preset Answers */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Suggested / Demo Scenarios (Click to populate):
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {currentQuestion.suggestedAnswers.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDraftAnswer(sug)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-900 hover:bg-[#FFE600]"
                    >
                      {sug}
                      {currentQuestion.unit === "%" ? "%" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultant Notes & Follow-Up */}
              <div className="pt-2">
                <label className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
                  Consultant Field Notes &amp; Follow-up Probe
                </label>
                <p className="mt-0.5 text-xs text-slate-500 italic">
                  Recommended follow-up: &ldquo;{currentQuestion.followUpPrompt}&rdquo;
                </p>
                <textarea
                  rows={2}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Document interviewee context, root-cause caveats, or plant-specific nuances…"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Attach Supporting Evidence Datasets */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Paperclip className="h-3.5 w-3.5 text-slate-600" />
                  <span>Linked Supporting Evidence</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Required: {currentQuestion.requiredEvidence}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {datasets.map((ds) => {
                  const attached = currentQuestion.attachedDatasetIds.includes(ds.id);
                  return (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => toggleDatasetOnQuestion(currentQuestion.id, ds.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        attached
                          ? "border-slate-900 bg-slate-900 text-[#FFE600]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      <Database className="h-3 w-3" />
                      <span>{ds.datasetType}</span>
                      {attached && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Conversational AI Copilot Drawer */}
            {copilotOpen && (
              <div className="rounded-lg border border-slate-300 bg-slate-900 p-4 text-white">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFE600]">
                    Diagnostic AI Copilot (Context-Grounded)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Active Question: {currentQuestion.fieldCode}
                  </span>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded bg-slate-950/70 p-3 text-xs">
                  {copilotLog.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.role === "user"
                          ? "text-right font-semibold text-[#FFE600]"
                          : "text-slate-200"
                      }
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleCopilotAsk} className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    placeholder="Ask how this metric impacts benchmarks or root causes…"
                    className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-[#FFE600] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded bg-[#FFE600] px-3 py-1.5 text-xs font-bold text-slate-950"
                  >
                    <Send className="h-3 w-3" />
                    <span>Ask</span>
                  </button>
                </form>
              </div>
            )}
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
              <span>Previous Question</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => skipQuestion(currentQuestion.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span>Skip</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Answer</span>
              </button>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-extrabold text-slate-950 hover:opacity-90"
              >
                <span>Save &amp; Next Question</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (3 cols): Live Diagnostic Telemetry */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Captured KPIs (Click any KPI for details) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Live Extracted KPIs
            </h3>
            <div className="mt-2 divide-y divide-slate-100 text-xs">
              {[
                {
                  id: "invoices_per_fte" as const,
                  label: "Invoices / FTE",
                  val: `${coreMetrics.invoicesPerFte.toLocaleString()}/yr`,
                },
                {
                  id: "po_backed_rate" as const,
                  label: "PO-Backed Invoices",
                  val: `${coreMetrics.poBackedRate}%`,
                },
                {
                  id: "touchless_rate" as const,
                  label: "Touchless Rate",
                  val: `${coreMetrics.touchlessRate}%`,
                },
                {
                  id: "exception_rate" as const,
                  label: "Exception Rate",
                  val: `${coreMetrics.exceptionRate}%`,
                },
                {
                  id: "cycle_time_days" as const,
                  label: "Cycle Time",
                  val: `${coreMetrics.cycleTimeDays.toFixed(1)} days`,
                },
                {
                  id: "on_time_payment_rate" as const,
                  label: "On-Time Payment",
                  val: `${coreMetrics.onTimePaymentRate}%`,
                },
                {
                  id: "discount_capture_rate" as const,
                  label: "Discount Capture",
                  val: `${coreMetrics.discountCaptureRate}%`,
                },
                {
                  id: "vendor_query_rate" as const,
                  label: "Vendor Queries",
                  val: `${coreMetrics.vendorQueryRatePer1k} / 1k inv`,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openKpiDrilldown(item.id)}
                  className="flex w-full items-center justify-between py-2 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-mono font-bold text-slate-900 underline decoration-[#FFE600] decoration-2 tabular-nums">
                    {item.val}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Identified Risks & Contradiction Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Validation &amp; Control Alerts ({validationWarnings.length})</span>
            </h3>
            <div className="mt-2.5 space-y-2">
              {validationWarnings.map((w, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-slate-800"
                >
                  {w.message}
                </div>
              ))}
            </div>
          </div>

          {/* Active Question Causal Links */}
          <div className="rounded-xl border border-slate-800 bg-[#0D1B2E] p-4 text-white shadow-xs space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#FFE600] uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Active Question Traceability</span>
            </h3>
            <div className="space-y-1.5 text-xs text-slate-300">
              {linkedStagesForQuestion.length > 0 && (
                <p>
                  <strong className="text-white">Process Stages:</strong>{" "}
                  {linkedStagesForQuestion.map((s) => s.shortName).join(", ")}
                </p>
              )}
              {linkedRcsForQuestion.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-white">Linked Root Causes:</span>
                  {linkedRcsForQuestion.map((rc) => (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => navigateTo("root-causes")}
                      className="block w-full rounded bg-slate-800/90 px-2.5 py-1.5 text-left text-[11px] text-slate-200 hover:bg-slate-700"
                    >
                      <span className="font-mono font-bold text-[#FFE600]">{rc.code}:</span>{" "}
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
