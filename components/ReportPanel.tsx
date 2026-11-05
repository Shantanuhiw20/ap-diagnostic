"use client";

import { useState } from "react";
import { ReportMarkdown } from "./ReportMarkdown";
import { Markdown } from "./Markdown";
import { TypingDots } from "./TypingDots";
import { exportReportToPdf } from "@/lib/export-pdf";
import { clientAccentCss } from "@/lib/client-accent";

export type ReportStatus = "idle" | "loading" | "done" | "error";

function pdfFilename(clientName?: string): string {
  const slug = clientName?.trim()
    ? clientName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
    : "ap";
  return `${slug}-diagnostic-report.pdf`;
}

function mdFilename(clientName?: string): string {
  const slug = clientName?.trim()
    ? clientName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
    : "ap";
  return `${slug}-diagnostic-report.md`;
}

function formattedToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ReportPanel({
  open,
  onClose,
  status,
  text,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  status: ReportStatus;
  text: string;
  clientName?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reviewText, setReviewText] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "cfo-review">("report");

  if (!open) return null;

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      await exportReportToPdf(text, { clientName, filename: pdfFilename(clientName) });
    } finally {
      setExporting(false);
    }
  }

  function handleDownloadMarkdown() {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mdFilename(clientName);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRunCfoReview() {
    setActiveTab("cfo-review");
    if (reviewStatus === "loading") return;
    setReviewStatus("loading");
    setReviewText("");

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: text }),
      });

      if (!res.ok || !res.body) throw new Error("Review failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReviewText(accumulated);
      }

      setReviewStatus(accumulated.trim() ? "done" : "error");
    } catch {
      setReviewStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close report"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-ey-black/65"
      />
      <div className="animate-slide-in relative flex h-full w-full max-w-5xl flex-col bg-ey-grey-100 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ey-grey-200 bg-ey-white px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="font-[var(--font-display)] text-lg font-extrabold text-ey-black">
              Accounts Payable Diagnostic Deliverable
            </h2>
            {status === "done" && text && (
              <div className="flex items-center rounded border border-ey-grey-200 bg-ey-grey-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("report")}
                  className={`rounded-sm px-3 py-1.5 transition-colors ${
                    activeTab === "report"
                      ? "bg-ey-black text-ey-white"
                      : "text-ey-grey-700 hover:text-ey-black"
                  }`}
                >
                  Diagnostic Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (reviewStatus === "idle") {
                      handleRunCfoReview();
                    } else {
                      setActiveTab("cfo-review");
                    }
                  }}
                  className={`rounded-sm px-3 py-1.5 transition-colors ${
                    activeTab === "cfo-review"
                      ? "bg-ey-black text-ey-white"
                      : "text-ey-grey-700 hover:text-ey-black"
                  }`}
                >
                  Sceptical CFO Review
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-2 text-ey-grey-700 transition-colors hover:bg-ey-grey-100 hover:text-ey-black"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {status === "loading" && (
            <div className="mx-auto max-w-4xl rounded border border-ey-grey-200 bg-white p-8">
              <div className="flex items-center gap-3 text-ey-charcoal">
                <TypingDots />
                <span className="font-medium">
                  Synthesising interview transcript, benchmarking metrics against India &amp; Global peer points, and building 6-section report…
                </span>
              </div>
              {text && (
                <div className="mt-6 border-t border-ey-grey-200 pt-6 opacity-80">
                  <pre className="max-h-96 overflow-y-auto font-mono text-xs whitespace-pre-wrap text-ey-grey-700">
                    {text}
                  </pre>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <p className="rounded border border-ey-black bg-ey-yellow px-4 py-3 text-sm font-medium text-ey-black">
              Something went wrong generating the report. Close this panel and try again.
            </p>
          )}

          {status === "done" && text && activeTab === "report" && (
            <div className="mx-auto max-w-4xl border border-ey-grey-200 bg-white p-6 shadow-sm sm:p-10">
              {/* Cover block per context/sample-data/design.md:
                  Full-bleed dark ey-navy (#0D1B2E) field with a plain ey-yellow (#FFE600)
                  rectangle block in the upper-left containing black bold text. */}
              <div className="relative mb-8 overflow-hidden bg-ey-navy p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between sm:mb-0 sm:justify-end">
                  <div className="text-right">
                    <span className="font-[var(--font-display)] text-2xl font-black tracking-tight text-ey-white">
                      EY
                    </span>
                    <p className="font-[var(--font-display)] text-[10px] font-bold tracking-[0.2em] text-ey-grey-200 uppercase">
                      Finance Transformation
                    </p>
                  </div>
                </div>

                <div className="relative max-w-2xl bg-ey-yellow p-6 text-ey-black sm:mt-3.5">
                  {clientName && (
                    <div
                      className="
                        absolute inset-x-0 bottom-0 h-1.5
                      "
                      style={{ backgroundColor: clientAccentCss(clientName) }}
                      aria-hidden="true"
                    />
                  )}
                  <p className="font-[var(--font-display)] text-xs font-extrabold tracking-[0.16em] text-ey-black uppercase">
                    {clientName ? clientName : "Client: Not Established"}
                  </p>
                  <h1 className="mt-1.5 font-[var(--font-display)] text-xl font-black tracking-tight text-ey-black sm:text-2xl">
                    Accounts Payable Diagnostic: Current State Assessment
                  </h1>
                  <p className="mt-2.5 text-xs font-semibold text-ey-charcoal">
                    Process in scope: Accounts Payable · Generated {formattedToday()}
                  </p>
                </div>
              </div>

              <ReportMarkdown>{text}</ReportMarkdown>

              {/* Footer matching design.md */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-ey-grey-200 pt-4 text-xs text-ey-grey-700">
                <span>EY Finance Transformation</span>
                <span>{formattedToday()}</span>
                <span>Accounts Payable Diagnostic: Current State Assessment</span>
              </div>
            </div>
          )}

          {status === "done" && text && activeTab === "cfo-review" && (
            <div className="mx-auto max-w-4xl border border-ey-grey-200 bg-white p-6 shadow-sm sm:p-10">
              <div className="mb-6 border-l-4 border-ey-yellow bg-ey-charcoal px-5 py-4 text-ey-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="font-[var(--font-display)] text-[11px] font-bold tracking-[0.18em] text-ey-yellow uppercase">
                      EY Reviewer Agent · context/agents/reviewer.md
                    </span>
                    <h3 className="mt-1 font-[var(--font-display)] text-lg font-extrabold text-ey-white">
                      Sceptical CFO First-5-Minutes Stress Test
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunCfoReview}
                    disabled={reviewStatus === "loading"}
                    className="rounded bg-ey-yellow px-3.5 py-1.5 text-xs font-bold text-ey-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewStatus === "loading" ? "Reviewing…" : "Re-run Review"}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-ey-grey-200">
                  Challenges unquantified claims, causal assertions missing reason-code splits, and missing rupee/dollar denominators before the report goes to the client.
                </p>
              </div>

              {reviewStatus === "loading" && !reviewText && (
                <div className="flex items-center gap-2 py-6 text-ey-grey-700">
                  <TypingDots />
                  <span>Running sceptical CFO audit on the draft report…</span>
                </div>
              )}

              {reviewText && (
                <div className="prose max-w-none">
                  <Markdown>{reviewText}</Markdown>
                </div>
              )}

              {reviewStatus === "error" && (
                <p className="rounded border border-ey-black bg-ey-yellow px-4 py-3 text-sm font-medium text-ey-black">
                  Could not complete the CFO review. Click &ldquo;Re-run Review&rdquo; to try again.
                </p>
              )}
            </div>
          )}
        </div>

        {status === "done" && text && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ey-grey-200 bg-ey-white px-6 py-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exporting}
                className="rounded bg-ey-yellow px-5 py-2.5 text-xs font-extrabold tracking-wide text-ey-black uppercase transition-opacity hover:enabled:opacity-90 disabled:opacity-50"
              >
                {exporting ? "Preparing PDF…" : "Download Branded PDF"}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="rounded border border-ey-black bg-white px-4 py-2.5 text-xs font-bold tracking-wide text-ey-black uppercase transition-colors hover:bg-ey-grey-100"
              >
                Export Markdown (.md)
              </button>
            </div>
            <button
              type="button"
              onClick={handleRunCfoReview}
              className="rounded bg-ey-charcoal px-4 py-2.5 text-xs font-bold tracking-wide text-ey-white uppercase transition-colors hover:bg-ey-black"
            >
              {activeTab === "cfo-review" ? "Refresh CFO Stress-Test" : "Run CFO Stress-Test Review →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

