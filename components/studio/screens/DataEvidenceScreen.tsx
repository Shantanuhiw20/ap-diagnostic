"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Link2,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { DataDataset, KpiId } from "@/lib/studio/types";
import {
  SAMPLE_EXTRACT_CONTENT,
  SAMPLE_EXTRACT_FILENAME,
} from "@/lib/ap-diagnostic-data";

const DATASET_TYPES: DataDataset["datasetType"][] = [
  "AP Invoice Extract",
  "Invoice Aging Report",
  "Vendor Master",
  "Purchase Order Extract",
  "Payment Extract",
  "GL Extract",
  "Process Documentation",
  "SOPs",
  "Other Evidence",
];

export function DataEvidenceScreen() {
  const {
    datasets,
    kpiBenchmarks,
    processStages,
    rootCauses,
    opportunities,
    uploadDatasetFile,
    removeDataset,
    updateDatasetLinks,
    openKpiDrilldown,
  } = useStudio();

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    datasets[0]?.id ?? "",
  );
  const [datasetType, setDatasetType] =
    useState<DataDataset["datasetType"]>("AP Invoice Extract");
  const [dataPeriod, setDataPeriod] = useState("Q4 FY2026 Extract");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDataset =
    datasets.find((d) => d.id === selectedDatasetId) ?? datasets[0];

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

  const handleSimulateSampleCsvUpload = async () => {
    const file = new File([SAMPLE_EXTRACT_CONTENT], SAMPLE_EXTRACT_FILENAME, {
      type: "text/csv",
    });
    await handleProcessUpload(file);
  };

  const allValidationIssues = datasets.flatMap((ds) =>
    ds.validationIssues.map((v) => ({ ...v, datasetName: ds.fileName, datasetType: ds.datasetType })),
  );

  const toggleKpiLink = (ds: DataDataset, kpiId: KpiId) => {
    const exists = ds.linkedKpiIds.includes(kpiId);
    const next = exists
      ? ds.linkedKpiIds.filter((k) => k !== kpiId)
      : [...ds.linkedKpiIds, kpiId];
    updateDatasetLinks(ds.id, { linkedKpiIds: next });
  };

  const toggleRootCauseLink = (ds: DataDataset, rcId: string) => {
    const exists = ds.linkedRootCauseIds.includes(rcId);
    const next = exists
      ? ds.linkedRootCauseIds.filter((r) => r !== rcId)
      : [...ds.linkedRootCauseIds, rcId];
    updateDatasetLinks(ds.id, { linkedRootCauseIds: next });
  };

  const toggleOpportunityLink = (ds: DataDataset, oppId: string) => {
    const exists = ds.linkedOpportunityIds.includes(oppId);
    const next = exists
      ? ds.linkedOpportunityIds.filter((o) => o !== oppId)
      : [...ds.linkedOpportunityIds, oppId];
    updateDatasetLinks(ds.id, { linkedOpportunityIds: next });
  };

  return (
    <div className="space-y-6">
      {/* 1. DATA INTAKE & UPLOAD PANEL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Controls (5 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Finance Data Intake
              </span>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Automated Schema Validation
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              Upload AP Extracts &amp; Process Evidence
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload ERP extracts to validate schema integrity (missing PO references, duplicate invoices, unmapped vendor IDs) or attach process SOPs.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Dataset Category
                </label>
                <select
                  value={datasetType}
                  onChange={(e) =>
                    setDatasetType(e.target.value as DataDataset["datasetType"])
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {DATASET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Data Period
                </label>
                <input
                  type="text"
                  value={dataPeriod}
                  onChange={(e) => setDataPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700">
                Dataset Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., SAP FBL1N vendor line item extract for Plant 1–4"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
            </div>

            {/* Drag and drop zone */}
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
              className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
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
              <Upload className="h-6 w-6 text-slate-600" />
              <p className="mt-2 text-xs font-bold text-slate-900">
                Drag &amp; drop a file here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="underline decoration-[#FFE600] decoration-2"
                >
                  browse computer
                </button>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Supported formats: .CSV, .XLSX, .PDF, .TXT, .JSON
              </p>

              {uploadProgress !== null && (
                <div className="mt-3 w-full max-w-xs">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-[#0D1B2E] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-slate-700">
                    Validating schema &amp; records ({uploadProgress}%)…
                  </p>
                </div>
              )}

              {fileError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{fileError}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">
              Sample ERP extract:
            </span>
            <button
              type="button"
              onClick={handleSimulateSampleCsvUpload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:opacity-90"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>+ Load Sample Invoice Aging CSV</span>
            </button>
          </div>
        </div>

        {/* Data Quality & Validation Summary (7 cols) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Automated Data Quality &amp; Anomaly Audit
              </span>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                Validation Issues Detected Across Datasets ({allValidationIssues.length})
              </h2>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-bold text-slate-800 tabular-nums">
              Total Records Indexed:{" "}
              {datasets.reduce((s, d) => s + d.records, 0).toLocaleString()}
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {allValidationIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5"
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
                    Source: <strong className="text-slate-700">{issue.datasetType}</strong> (
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
        </div>
      </div>

      {/* 2. DATASET REGISTER TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Diagnostic Evidence &amp; Dataset Register ({datasets.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select a dataset row to inspect or adjust its traceability mapping below.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Provenance &amp; Audit Trail Tracked</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                <th className="px-3.5 py-2.5 font-bold">Dataset</th>
                <th className="px-3.5 py-2.5 font-bold">File Name</th>
                <th className="px-3.5 py-2.5 font-bold">Records</th>
                <th className="px-3.5 py-2.5 font-bold">Data Period</th>
                <th className="px-3.5 py-2.5 font-bold">Status &amp; Provenance</th>
                <th className="px-3.5 py-2.5 font-bold">Validation Issues</th>
                <th className="px-3.5 py-2.5 font-bold">Last Updated</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {datasets.map((ds) => {
                const isSelected = selectedDataset?.id === ds.id;
                return (
                  <tr
                    key={ds.id}
                    onClick={() => setSelectedDatasetId(ds.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-amber-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 shrink-0 text-slate-700" />
                        <span>{ds.datasetType}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-700">
                      {ds.fileName}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900 tabular-nums">
                      {ds.records.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">{ds.dataPeriod}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ds.status === "Verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : ds.status === "Warnings"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ds.status === "Verified" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {ds.status}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            ds.isUploadedByUser
                              ? "bg-slate-900 text-[#FFE600]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ds.isUploadedByUser ? "User Uploaded" : "Demo Baseline"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      {ds.validationIssues.length === 0 ? (
                        <span className="text-emerald-700 font-semibold">0 issues</span>
                      ) : (
                        <span className="font-semibold text-amber-800">
                          {ds.validationIssues.length} finding(s)
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500">
                      {ds.lastUpdated}
                    </td>
                    <td
                      className="px-3.5 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDatasetType(ds.datasetType);
                            fileInputRef.current?.click();
                          }}
                          className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                          title="Replace dataset file"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDataset(ds.id)}
                          className="rounded border border-slate-200 bg-white p-1.5 text-red-600 hover:border-red-600 hover:bg-red-50"
                          title="Remove dataset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. EVIDENCE MAPPING & TRACEABILITY MATRIX */}
      {selectedDataset && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <Link2 className="h-4 w-4 text-slate-800" />
                <span>Evidence Traceability Matrix</span>
              </span>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">
                Mapping for {selectedDataset.datasetType} (<code>{selectedDataset.fileName}</code>)
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDataset.description}
              </p>
            </div>
            {selectedDataset.parsedSummary && (
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedDataset.parsedSummary.poBackedPct !== undefined && (
                  <span className="rounded bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-800">
                    Extracted PO-Backed: {selectedDataset.parsedSummary.poBackedPct}%
                  </span>
                )}
                {selectedDataset.parsedSummary.exceptionPct !== undefined && (
                  <span className="rounded bg-amber-100 px-2.5 py-1 font-mono font-bold text-amber-900">
                    Extracted Exceptions: {selectedDataset.parsedSummary.exceptionPct}%
                  </span>
                )}
                {selectedDataset.parsedSummary.onTimePct !== undefined && (
                  <span className="rounded bg-emerald-100 px-2.5 py-1 font-mono font-bold text-emerald-900">
                    Extracted On-Time: {selectedDataset.parsedSummary.onTimePct}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Column 1: Supported KPIs */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                1. Supported Operational KPIs ({selectedDataset.linkedKpiIds.length})
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Toggle which KPIs rely on this evidence file:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {kpiBenchmarks.map((k) => {
                  const active = selectedDataset.linkedKpiIds.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKpiLink(selectedDataset, k.id)}
                      onDoubleClick={() => openKpiDrilldown(k.id)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-900 text-[#FFE600]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {k.shortName} {active ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Supported Root Causes */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                2. Evidenced Root Causes ({selectedDataset.linkedRootCauseIds.length})
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Toggle which root causes are proved by this dataset:
              </p>
              <div className="mt-3 space-y-1.5">
                {rootCauses.map((rc) => {
                  const active = selectedDataset.linkedRootCauseIds.includes(rc.id);
                  return (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => toggleRootCauseLink(selectedDataset, rc.id)}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-1.5 text-left text-xs font-semibold transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-900 text-[#FFE600]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span className="truncate">
                        {rc.code}: {rc.title}
                      </span>
                      <span className="ml-2 shrink-0">{active ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Supported Opportunities & Stages */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                3. Linked Transformation Opportunities ({selectedDataset.linkedOpportunityIds.length})
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Toggle which opportunities are sized from this dataset:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opportunities.map((opp) => {
                  const active = selectedDataset.linkedOpportunityIds.includes(opp.id);
                  return (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => toggleOpportunityLink(selectedDataset, opp.id)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-900 text-[#FFE600]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {opp.code} {active ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2.5 text-[11px] text-slate-600">
                <strong>Mapped Process Stages:</strong>{" "}
                {processStages
                  .filter((s) => selectedDataset.linkedStageIds.includes(s.id))
                  .map((s) => s.shortName)
                  .join(", ")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
