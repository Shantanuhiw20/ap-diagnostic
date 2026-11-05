"use client";

import React from "react";
import {
  Lock,
  MessageSquareText,
  Database,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";

export function DiagnosticGate({
  screenTitle,
  description,
}: {
  screenTitle: string;
  description: string;
}) {
  const {
    coreMetrics,
    datasets,
    navigateTo,
    loadCompletedDemoBaseline,
  } = useStudio();

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0D1B2E] text-[#FFE600]">
          <Lock className="h-6 w-6" />
        </div>

        <span className="mt-4 inline-block rounded bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-amber-900 uppercase">
          Awaiting Diagnostic Inputs
        </span>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          {screenTitle} Not Yet Generated
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Live Prerequisite Checklist */}
        <div className="mx-auto mt-6 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase">
                1. Diagnostic Interview
              </span>
              {coreMetrics.answeredCount > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <p className="mt-1 font-mono text-sm font-extrabold text-slate-900">
              {coreMetrics.answeredCount} / {coreMetrics.totalQuestions} Answered
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Volume, FTEs, PO split, exceptions &amp; controls
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase">
                2. SAP Data Extracts
              </span>
              {datasets.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <p className="mt-1 font-mono text-sm font-extrabold text-slate-900">
              {datasets.length} / 4 Files Loaded
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Invoice register, aging, vendor master &amp; PO logs
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("interview")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D1B2E] px-4 py-2.5 text-xs font-extrabold text-[#FFE600] shadow-xs transition-colors hover:bg-slate-800"
          >
            <MessageSquareText className="h-4 w-4" />
            <span>Start Diagnostic Interview →</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("data")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Database className="h-4 w-4" />
            <span>Load SAP Data Extracts →</span>
          </button>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={loadCompletedDemoBaseline}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 underline decoration-[#FFE600] decoration-2 hover:text-slate-900"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Presenter Shortcut: Auto-Load Full Demo Baseline (100%)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
