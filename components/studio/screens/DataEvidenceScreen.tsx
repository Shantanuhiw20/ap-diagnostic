"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  FileCheck2,
  Database,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { DataDataset } from "@/lib/studio/types";
import { INITIAL_DATASETS } from "@/lib/studio/seed-data";

const DATASET_TYPES: DataDataset["datasetType"][] = [
  "AP Invoice Extract",
  "Invoice Aging Report",
  "Vendor Master",
  "Purchase Order Extract",
];

export function DataEvidenceScreen() {
  const {
    datasets,
    coreMetrics,
    uploadDatasetFile,
    removeDataset,
    ingestAllSampleDatasets,
    ingestSingleSampleDataset,
    navigateTo,
  } = useStudio();

  const [datasetType, setDatasetType] =
    useState<DataDataset["datasetType"]>("AP Invoice Extract");
  const [dataPeriod, setDataPeriod] = useState("FY2026 Rolling 12M");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessUpload = async (file: File) => {
    setFileError(null);
    if (!/\.(csv|txt|json|pdf|xlsx)$/i.test(file.name)) {
      setFileError(
        "Unsupported file type. Please upload .csv, .txt, .pdf, or .xlsx evidence files.",
      );
      return;
    }

    setUploadProgress(35);
    await new Promise((r) => setTimeout(r, 180));
    setUploadProgress(80);
    await uploadDatasetFile(file, datasetType, dataPeriod, description);
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(null), 400);
    setDescription("");
  };

  const allValidationIssues = datasets.flatMap((ds) =>
    ds.validationIssues.map((v) => ({
      ...v,
      datasetName: ds.fileName,
      datasetType: ds.datasetType,
    })),
  );

  const corroborationRows = [
    {
      area: "PO Coverage & Maverick Indirect Spend",
      interviewSignal: coreMetrics.answeredFieldCodes.includes("ap_04")
        ? `${coreMetrics.poBackedRate}% PO-Backed (${100 - coreMetrics.poBackedRate}% Non-PO)`
        : "62% PO-Backed (Target Interview Baseline)",
      sapExtract: "DS-01: SAP FBL1N Invoice Register (12,000 rows/mo)",
      erpFinding:
        "4,560 monthly invoices (38.0%) arrive with blank PO reference; 615 POs in DS-04 created retrospectively after invoice date.",
      linkedRc: "RC-01 · $244k/yr Value",
    },
    {
      area: "3-Way Match Exceptions & Dock GRN Delays",
      interviewSignal: coreMetrics.answeredFieldCodes.includes("ap_08")
        ? `${coreMetrics.exceptionRate}% Manual Exception Rate`
        : "18% Manual Exception Rate ($25 freight cap)",
      sapExtract: "DS-02: SAP MRBR Aging & Blocked Log (2,160 rows)",
      erpFinding:
        "44% blocked due to Plant 2 & 4 MIGO dock receipts posted 2–4 days late; 31% non-PO coding hold; 25% freight variance > $25.",
      linkedRc: "RC-02 · $210k/yr Value",
    },
    {
      area: "Approval Dwell Time & Discount Leakage",
      interviewSignal: coreMetrics.answeredFieldCodes.includes("ap_14")
        ? `${coreMetrics.cycleTimeDays.toFixed(1)}d Cycle · ${coreMetrics.discountCaptureRate}% Discount Capture`
        : "6.0d Cycle Time · 38% Discount Capture",
      sapExtract: "DS-04: SAP PO & 2/10 Net 30 Discount Log (7,440 rows)",
      erpFinding:
        "$14.0M spend carries 2/10 Net 30 terms ($280k pool); 62% ($173.6k/yr) expires awaiting sequential controller sign-off.",
      linkedRc: "RC-03 · $132k/yr Cash",
    },
    {
      area: "Vendor Master SoD & Payment Terms Proliferation",
      interviewSignal: coreMetrics.answeredFieldCodes.includes("ap_01")
        ? `${coreMetrics.activeVendors.toLocaleString()} Active Vendors · Unsegregated XK01/XK02`
        : "3,150 Active Vendors · Unsegregated SoD",
      sapExtract: "DS-03: SAP LFA1/LFB1 Vendor Master Audit (3,150 rows)",
      erpFinding:
        "26 vendor pairs share identical bank IBANs; 47 distinct payment term codes active; 3 AP processors hold both XK01 & MIRO rights.",
      linkedRc: "RC-04 & RC-05 · $156k/yr + $750k WC",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. ERP EVIDENCE PACK INGESTION COMMAND BANNER */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1B2E] p-5 text-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#FFE600] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-950 uppercase">
                Step 2 · ERP Transaction Verification
              </span>
              <span className="text-xs font-bold text-slate-200">
                {datasets.length} of {INITIAL_DATASETS.length} Core SAP Extracts Ingested (
                {datasets.reduce((s, d) => s + d.records, 0).toLocaleString()} rows audited)
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-extrabold text-white">
              Corroborate Interview Responses with SAP ERP Evidence
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Ingest the 4 client SAP extracts below (individually or in one click) to run automated schema &amp; control audits across 24,750 records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={ingestAllSampleDatasets}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-4 py-2 text-xs font-extrabold text-slate-950 shadow-xs transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {datasets.length === INITIAL_DATASETS.length
                  ? "Re-Verify All 4 SAP Extracts"
                  : "Ingest & Audit All 4 SAP Extracts (24,750 Rows)"}
              </span>
            </button>

            {datasets.length > 0 && (
              <button
                type="button"
                onClick={() => navigateTo("benchmarks")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:border-[#FFE600]"
              >
                <span>View Peer Benchmarks</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#FFE600]" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Ready-to-Ingest SAP Extract Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INITIAL_DATASETS.map((sample, idx) => {
            const isLoaded = datasets.some((d) => d.id === sample.id);
            return (
              <div
                key={sample.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isLoaded
                    ? "border-emerald-500/40 bg-slate-900/90"
                    : "border-slate-700/80 bg-slate-900/50 hover:border-slate-500"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#FFE600]">
                      DS-0{idx + 1} · {sample.records.toLocaleString()} ROWS
                    </span>
                    {isLoaded ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Audited
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                        Pending Intake
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-extrabold text-white">
                    {sample.datasetType}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400 truncate">
                    {sample.fileName}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-300">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-amber-300">
                    {sample.validationIssues.length} audit anomaly rule(s)
                  </span>
                  {isLoaded ? (
                    <button
                      type="button"
                      onClick={() => removeDataset(sample.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => ingestSingleSampleDataset(sample.id)}
                      className="inline-flex items-center gap-1 rounded bg-[#FFE600] px-2.5 py-1 text-[11px] font-extrabold text-slate-950 hover:opacity-90"
                    >
                      <Database className="h-3 w-3" />
                      <span>Ingest Extract</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CUSTOM FILE UPLOAD + AUTOMATED ANOMALY AUDIT RESULTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Custom CSV (4 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Custom File Upload
            </span>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900">
              Upload Additional Client CSV / Excel Extract
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Drop any custom ERP extract to parse PO coverage, exception flags, and duplicate invoice keys live in the browser.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Extract Category
                </label>
                <select
                  value={datasetType}
                  onChange={(e) =>
                    setDatasetType(e.target.value as DataDataset["datasetType"])
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                >
                  {DATASET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Data Period
                </label>
                <input
                  type="text"
                  value={dataPeriod}
                  onChange={(e) => setDataPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleProcessUpload(f);
              }}
              className={`mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                dragActive
                  ? "border-slate-900 bg-amber-50/60"
                  : "border-slate-300 bg-slate-50/70 hover:border-slate-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json,.pdf,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessUpload(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <Upload className="h-5 w-5 text-slate-600" />
              <p className="mt-1.5 text-xs font-bold text-slate-900">
                Drag &amp; drop CSV here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="underline decoration-[#FFE600] decoration-2"
                >
                  browse file
                </button>
              </p>
              {uploadProgress !== null && (
                <p className="mt-2 text-[11px] font-bold text-slate-700">
                  Auditing records ({uploadProgress}%)…
                </p>
              )}
              {fileError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{fileError}</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Client-side schema validation
            </span>
            <span>CSV · XLSX · PDF</span>
          </div>
        </div>

        {/* Automated Data Quality & Anomaly Audit Findings (8 cols) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Automated ERP Anomaly &amp; Control Audit
              </span>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                Validation Findings Detected ({allValidationIssues.length})
              </h2>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-bold text-slate-800 tabular-nums">
              Total Records Audited:{" "}
              {datasets.reduce((s, d) => s + d.records, 0).toLocaleString()}
            </span>
          </div>

          {datasets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
              <FileSpreadsheet className="h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-bold text-slate-800">
                No ERP Extracts Ingested Yet
              </p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Click <strong>&ldquo;Ingest &amp; Audit All 4 SAP Extracts&rdquo;</strong> above to run automated checks for non-PO invoices, delayed dock GRNs, duplicate IBANs, and expired discounts.
              </p>
              <button
                type="button"
                onClick={ingestAllSampleDatasets}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0D1B2E] px-4 py-2 text-xs font-extrabold text-[#FFE600] hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ingest All 4 SAP Extracts Now</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {allValidationIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          issue.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : issue.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {issue.severity} severity
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {issue.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{issue.description}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Extract: <strong className="text-slate-700">{issue.datasetType}</strong> (
                      <code>{issue.datasetName}</code> · Field: <code>{issue.affectedField}</code>)
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-extrabold text-slate-900 tabular-nums">
                      {issue.count.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-500">affected records</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. INTERVIEW VS. SAP DATA CORROBORATION TABLE (Ties the Story Together!) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              End-to-End Evidence Traceability
            </span>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">
              Interview Responses Corroborated by SAP Transaction Logs
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-900">
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
            <span>100% Causal Alignment Across Interview, ERP Logs &amp; CFO Business Case</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase">
                <th className="px-3.5 py-2.5 font-bold">Diagnostic Pillar</th>
                <th className="px-3.5 py-2.5 font-bold">Interview Baseline Captured</th>
                <th className="px-3.5 py-2.5 font-bold">Corroborating SAP Extract</th>
                <th className="px-3.5 py-2.5 font-bold">Transaction-Level Proof</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Causal &amp; Value Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {corroborationRows.map((row) => (
                <tr key={row.area} className="hover:bg-slate-50/80">
                  <td className="px-3.5 py-3 font-bold text-slate-900">{row.area}</td>
                  <td className="px-3.5 py-3 font-mono font-semibold text-slate-800">
                    {row.interviewSignal}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">{row.sapExtract}</td>
                  <td className="max-w-md px-3.5 py-3 text-slate-600 leading-snug">
                    {row.erpFinding}
                  </td>
                  <td className="px-3.5 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigateTo("root-causes")}
                      className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-bold text-[#FFE600] hover:bg-slate-800"
                    >
                      {row.linkedRc} →
                    </button>
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
