"use client";

import { useState } from "react";
import { ReportMarkdown } from "./ReportMarkdown";
import { TypingDots } from "./TypingDots";
import { exportReportToPdf } from "@/lib/export-pdf";
import { clientAccentCss } from "@/lib/client-accent";

export type ReportStatus = "idle" | "loading" | "done" | "error";

function pdfFilename(clientName?: string): string {
  const slug = clientName?.trim() ? clientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "ap";
  return `${slug}-diagnostic-report.pdf`;
}

function formattedToday(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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

  if (!open) return null;

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      await exportReportToPdf(text, { clientName, filename: pdfFilename(clientName) });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close report"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-ey-black/60"
      />
      <div className="animate-slide-in relative flex h-full w-full max-w-5xl flex-col bg-ey-grey-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ey-grey-200 bg-ey-white px-6 py-4">
          <h2 className="font-[var(--font-display)] text-lg font-extrabold text-ey-black">Diagnostic Report</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-ey-grey-700 transition-colors hover:bg-ey-grey-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-ey-grey-700">
              <TypingDots />
              <span>Generating report…</span>
            </div>
          )}

          {status === "error" && (
            <p className="rounded-lg border border-ey-black bg-ey-yellow px-4 py-3 text-sm font-medium text-ey-black">
              Something went wrong generating the report. Close this panel and try again.
            </p>
          )}

          {/* Rendered once, only after the stream finishes: feeding
              react-markdown a growing, mid-sentence markdown string on every
              chunk makes it re-parse malformed partial syntax (an open table
              row, an unclosed heading) on every render, which is both wasted
              work and how the duplicate-key console spam happened. */}
          {status === "done" && text && (
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm sm:p-12">
              <div className="relative mb-8 overflow-hidden rounded-lg bg-ey-black px-8 py-6">
                <div
                  className="absolute inset-y-0 right-[-10%] w-1/2 bg-ey-yellow"
                  style={{ clipPath: "polygon(35% 0, 100% 0, 65% 100%, 0 100%)" }}
                  aria-hidden="true"
                />
                {/* Minor client personalisation touch, EY stays the dominant
                    identity everywhere else on this cover and the report body. */}
                {clientName && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: clientAccentCss(clientName) }}
                    aria-hidden="true"
                  />
                )}
                <div className="relative">
                  <span className="font-[var(--font-display)] text-2xl font-black tracking-tight text-ey-white">
                    EY
                  </span>
                  <h1 className="mt-3 font-[var(--font-display)] text-2xl font-extrabold text-ey-white">
                    Accounts Payable Diagnostic Report
                  </h1>
                  <p className="mt-2 text-sm font-medium text-ey-grey-200">
                    Client:{" "}
                    {clientName ? (
                      <span className="font-semibold" style={{ color: clientAccentCss(clientName) }}>
                        {clientName}
                      </span>
                    ) : (
                      "not established"
                    )}{" "}
                    · Generated {formattedToday()}
                  </p>
                </div>
              </div>

              <ReportMarkdown>{text}</ReportMarkdown>
            </div>
          )}
        </div>

        {status === "done" && text && (
          <div className="border-t border-ey-grey-200 bg-ey-white px-6 py-4">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="rounded-full bg-ey-yellow px-6 py-3 text-sm font-bold text-ey-black transition-opacity hover:enabled:opacity-90 disabled:opacity-50"
            >
              {exporting ? "Preparing PDF…" : "Download as PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
