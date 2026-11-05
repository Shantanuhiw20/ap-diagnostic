"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { EyHeader } from "@/components/EyHeader";
import { Markdown } from "@/components/Markdown";
import { TypingDots } from "@/components/TypingDots";
import { ReportPanel, type ReportStatus } from "@/components/ReportPanel";
import { getMessageText } from "@/lib/message-text";
import {
  AP_CHECKLIST_FIELDS,
  FIXED_INTERVIEW_FIELD_IDS,
  HARLOW_REFERENCE_CASE,
  SAMPLE_EMAIL_CONTENT,
  SAMPLE_EMAIL_FILENAME,
  SAMPLE_EXTRACT_CONTENT,
  SAMPLE_EXTRACT_FILENAME,
  evaluateAllBenchmarks,
  type PriorityTier,
} from "@/lib/ap-diagnostic-data";
import { extractDiagnosticState } from "@/lib/ap-extractor";

const ACCEPTED_FILE_TYPES = ".txt,.csv,text/plain,text/csv";
const MAX_FILE_CHARS = 500_000;
const FILE_UPLOAD_PREFIX = "[Uploaded file:";
const REPORT_READY_PATTERN = /generate report/i;

type WorkbenchTab = "interview" | "checklist" | "benchmarks";

const QUICK_SAMPLE_ANSWERS: Record<string, Array<{ label: string; text: string }>> = {
  ap_03: [
    { label: "12,000 invoices / mo (Harlow)", text: "We process around 12,000 vendor invoices in a typical month." },
    { label: "8,412 invoices / mo (Northwind)", text: "We processed 8,412 invoices last month." },
    { label: "25,000 invoices / mo", text: "We process roughly 25,000 invoices per month." },
  ],
  ap_04: [
    { label: "62% PO-backed / 38% non-PO", text: "Only 62% of our invoices are PO-backed; the remaining 38% are non-PO." },
    { label: "60% PO-backed / 40% non-PO", text: "Around 60% are PO-backed and 40% do not have a PO attached." },
    { label: "88% PO-backed", text: "About 88% of invoices arrive against an approved PO." },
  ],
  ap_08: [
    { label: "18% exception rate", text: "Roughly 18% of invoices hit an exception and require manual resolution." },
    { label: "14% exception rate", text: "Our exception rate is around 14%, mostly on non-PO and freight variance." },
    { label: "6% exception rate", text: "About 6% of invoices hit a match exception." },
  ],
  ap_09: [
    { label: "6 days receipt-to-posting", text: "It takes an average of 6 days from invoice receipt to posting." },
    { label: "4.5 days cycle time", text: "Roughly 4 to 5 days from receipt to posting." },
    { label: "2 days cycle time", text: "Around 2 days from receipt to posting." },
  ],
  ap_11: [
    { label: "41% paid on time", text: "Only 41% of invoices are paid on time against agreed vendor terms." },
    { label: "55% paid on time", text: "Around 55% of our invoices are paid on time." },
    { label: "82% paid on time", text: "About 82% of invoices are paid on time." },
  ],
  ap_10: [
    { label: "58 days DPO", text: "Our average Days Payable Outstanding (DPO) is 58 days." },
    { label: "52 days DPO", text: "Average DPO is 52 days." },
    { label: "45 days DPO", text: "Our DPO averages 45 days." },
  ],
  ap_14: [
    { label: "38% discount capture", text: "We capture roughly 38% of eligible early-payment discounts." },
    { label: "25% discount capture", text: "Roughly 25% — most discount windows expire while waiting for approval." },
    { label: "75% discount capture", text: "We capture around 75% of early-payment discounts." },
  ],
  ap_17: [
    { label: "900 queries / mo (~75 per 1k)", text: "The team handles roughly 900 vendor queries a month." },
    { label: "650 queries / mo", text: "We handle around 650 vendor status queries per month." },
    { label: "250 queries / mo", text: "Around 250 vendor queries per month." },
  ],
  ap_19: [
    { label: "9 AP FTEs", text: "We have 9 FTEs working in the AP function today." },
    { label: "6 AP FTEs", text: "There are 6 FTEs in the AP team." },
    { label: "14 AP FTEs", text: "We have 14 FTEs across the AP team." },
  ],
};

function buildFileMessageText(fileName: string, content: string): string {
  const truncated = content.length > MAX_FILE_CHARS;
  const body = truncated ? content.slice(0, MAX_FILE_CHARS) : content;
  const suffix = truncated
    ? "\n\n[truncated, file was larger than the size this interview can accept]"
    : "";
  return `${FILE_UPLOAD_PREFIX} ${fileName}]\n${body}${suffix}`;
}

function isFileUploadMessage(text: string): boolean {
  return text.startsWith(FILE_UPLOAD_PREFIX);
}

export default function ChatClient({
  openingText,
  clientName,
  preset,
}: {
  openingText: string;
  clientName?: string;
  preset?: string;
}) {
  const [sessionKey, setSessionKey] = useState(0);

  return (
    <ChatSession
      key={sessionKey}
      openingText={openingText}
      clientName={clientName}
      preset={preset}
      onNewChat={() => setSessionKey((k) => k + 1)}
    />
  );
}

function ChatSession({
  openingText,
  clientName,
  preset,
  onNewChat,
}: {
  openingText: string;
  clientName?: string;
  preset?: string;
  onNewChat: () => void;
}) {
  const openingMessage = useMemo<UIMessage>(
    () => ({
      id: "opening",
      role: "assistant",
      parts: [{ type: "text", text: openingText }],
    }),
    [openingText],
  );

  const transport = useMemo(
    () => new DefaultChatTransport({ body: { clientName } }),
    [clientName],
  );

  const { messages, sendMessage, status, error } = useChat({
    messages: [openingMessage],
    transport,
  });

  const [activeTab, setActiveTab] = useState<WorkbenchTab>("interview");
  const [tierFilter, setTierFilter] = useState<PriorityTier | "ALL">("ALL");

  const [checklistOverrides, setChecklistOverrides] = useState<Record<string, string>>(() =>
    preset === "harlow" ? { ...HARLOW_REFERENCE_CASE.checklistAnswers } : {},
  );

  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<ReportStatus>("idle");
  const [reportText, setReportText] = useState("");
  const reportRequestId = useRef(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Convert UIMessages into plain role/text turns for live diagnostic extraction
  const plainMessages = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        text: getMessageText(m),
      })),
    [messages],
  );

  const diagnosticState = useMemo(
    () => extractDiagnosticState(plainMessages, checklistOverrides),
    [plainMessages, checklistOverrides],
  );

  const benchmarkEvaluations = useMemo(
    () => evaluateAllBenchmarks(diagnosticState.metrics),
    [diagnosticState.metrics],
  );

  const fixedAnsweredCount = useMemo(
    () =>
      FIXED_INTERVIEW_FIELD_IDS.filter(
        (id) => diagnosticState.fields[id]?.status === "ANSWERED",
      ).length,
    [diagnosticState.fields],
  );

  const nextOpenFixedFieldId = useMemo(
    () =>
      FIXED_INTERVIEW_FIELD_IDS.find(
        (id) => diagnosticState.fields[id]?.status !== "ANSWERED",
      ),
    [diagnosticState.fields],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  async function handleFile(file: File) {
    setFileError(null);

    if (busy) {
      setFileError("Wait for the current reply to finish before attaching a file.");
      return;
    }

    const isAccepted =
      /\.(txt|csv)$/i.test(file.name) ||
      file.type === "text/plain" ||
      file.type === "text/csv";
    if (!isAccepted) {
      setFileError("Only .txt or .csv files are accepted.");
      return;
    }

    try {
      const content = await file.text();
      sendMessage({ text: buildFileMessageText(file.name, content) });
    } catch {
      setFileError("Couldn't read that file. Try again.");
    }
  }

  function handleInjectSampleFile(fileName: string, content: string) {
    if (busy) return;
    setFileError(null);
    sendMessage({ text: buildFileMessageText(fileName, content) });
  }

  function handleLoadHarlowCase() {
    setChecklistOverrides({ ...HARLOW_REFERENCE_CASE.checklistAnswers });
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  async function handleGenerateReport() {
    setReportOpen(true);
    setReportStatus("loading");
    setReportText("");

    const requestId = ++reportRequestId.current;

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          clientName,
          checklistOverrides,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Report request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        if (requestId === reportRequestId.current) setReportText(accumulated);
      }

      if (requestId === reportRequestId.current) {
        setReportStatus(accumulated.trim() ? "done" : "error");
      }
    } catch {
      if (requestId === reportRequestId.current) setReportStatus("error");
    }
  }

  const lastMessage = messages[messages.length - 1];
  const lastMessageIsEmptyAssistant =
    !!lastMessage &&
    lastMessage.role === "assistant" &&
    getMessageText(lastMessage).trim() === "";
  const showTypingIndicator =
    busy &&
    (!lastMessage || lastMessage.role !== "assistant" || lastMessageIsEmptyAssistant);

  const visibleMessages =
    busy && lastMessageIsEmptyAssistant ? messages.slice(0, -1) : messages;

  const isReportReady =
    messages.some(
      (m) => m.role === "assistant" && REPORT_READY_PATTERN.test(getMessageText(m)),
    ) || diagnosticState.readinessVerdict !== "Not enough data to diagnose";

  useEffect(() => {
    if (activeTab === "interview") {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [visibleMessages, showTypingIndicator, activeTab]);

  const filteredChecklistFields = useMemo(() => {
    if (tierFilter === "ALL") return AP_CHECKLIST_FIELDS;
    return AP_CHECKLIST_FIELDS.filter((f) => f.tier === tierFilter);
  }, [tierFilter]);

  const quickChips = nextOpenFixedFieldId
    ? QUICK_SAMPLE_ANSWERS[nextOpenFixedFieldId] ?? []
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-ey-grey-100 text-ey-black">
      <EyHeader subtitle="Fin OS · AP Diagnostic Workbench" clientName={clientName}>
        <button
          type="button"
          onClick={() => {
            setChecklistOverrides({});
            onNewChat();
          }}
          className="rounded border border-ey-grey-700 bg-ey-charcoal px-3.5 py-2 text-xs font-bold tracking-wide text-ey-white uppercase transition-colors hover:bg-ey-black"
        >
          Reset Session
        </button>
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={!isReportReady}
          title={
            isReportReady
              ? "Generate the 6-section benchmarked AP Diagnostic Report"
              : "Provide PO coverage (ap_04) and Exception rate (ap_08) or complete the interview to unlock report generation"
          }
          className={
            isReportReady
              ? "rounded border-2 border-ey-black bg-ey-yellow px-4 py-2 text-xs font-extrabold tracking-wide text-ey-black uppercase shadow-sm transition-opacity hover:opacity-90"
              : "cursor-not-allowed rounded border border-ey-grey-700 bg-ey-charcoal px-4 py-2 text-xs font-bold tracking-wide text-ey-grey-400 uppercase"
          }
        >
          Generate Report
        </button>
      </EyHeader>

      {/* Secondary Workbench Navigation Bar */}
      <div className="sticky top-[61px] z-30 border-b border-ey-grey-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("interview")}
              className={`relative px-3.5 py-2 font-[var(--font-display)] text-xs font-extrabold tracking-wider uppercase transition-colors ${
                activeTab === "interview"
                  ? "text-ey-black"
                  : "text-ey-grey-700 hover:text-ey-black"
              }`}
            >
              1. AI Diagnostic Interview
              <span className="ml-1.5 rounded bg-ey-grey-100 px-1.5 py-0.5 text-[10px] font-bold text-ey-charcoal tabular-nums">
                {fixedAnsweredCount}/9
              </span>
              {activeTab === "interview" && (
                <span className="absolute inset-x-0 bottom-[-10px] h-1 bg-ey-yellow" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`relative px-3.5 py-2 font-[var(--font-display)] text-xs font-extrabold tracking-wider uppercase transition-colors ${
                activeTab === "checklist"
                  ? "text-ey-black"
                  : "text-ey-grey-700 hover:text-ey-black"
              }`}
            >
              2. 22-Field Data Checklist
              <span className="ml-1.5 rounded bg-ey-grey-100 px-1.5 py-0.5 text-[10px] font-bold text-ey-charcoal tabular-nums">
                {diagnosticState.answeredCount}/22
              </span>
              {activeTab === "checklist" && (
                <span className="absolute inset-x-0 bottom-[-10px] h-1 bg-ey-yellow" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("benchmarks")}
              className={`relative px-3.5 py-2 font-[var(--font-display)] text-xs font-extrabold tracking-wider uppercase transition-colors ${
                activeTab === "benchmarks"
                  ? "text-ey-black"
                  : "text-ey-grey-700 hover:text-ey-black"
              }`}
            >
              3. Benchmarks &amp; Extract Analysis
              <span className="ml-1.5 rounded bg-ey-grey-100 px-1.5 py-0.5 text-[10px] font-bold text-ey-charcoal tabular-nums">
                10 KPIs
              </span>
              {activeTab === "benchmarks" && (
                <span className="absolute inset-x-0 bottom-[-10px] h-1 bg-ey-yellow" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold uppercase ${
                diagnosticState.readinessVerdict === "Ready for a report"
                  ? "bg-ey-black text-ey-yellow"
                  : diagnosticState.readinessVerdict === "Enough to diagnose, thin in places"
                    ? "bg-ey-yellow text-ey-black"
                    : "bg-ey-grey-100 text-ey-grey-700"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {diagnosticState.readinessVerdict}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workbench Grid */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        {/* Left/Primary Column (8 cols on lg) */}
        <div className="flex flex-col lg:col-span-8">
          {activeTab === "interview" && (
            <div className="flex flex-1 flex-col rounded border border-ey-grey-200 bg-white shadow-xs">
              {/* Sample Data & Extract Quick-Load Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ey-grey-200 bg-ey-grey-100 px-4 py-2.5">
                <span className="text-[11px] font-bold tracking-wider text-ey-grey-700 uppercase">
                  Sample Client Inputs:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleInjectSampleFile(SAMPLE_EMAIL_FILENAME, SAMPLE_EMAIL_CONTENT)
                    }
                    className="rounded border border-ey-grey-200 bg-white px-2.5 py-1 text-xs font-semibold text-ey-black transition-colors hover:border-ey-black disabled:opacity-40"
                  >
                    + Attach AP Manager Email (.txt)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleInjectSampleFile(SAMPLE_EXTRACT_FILENAME, SAMPLE_EXTRACT_CONTENT)
                    }
                    className="rounded border border-ey-grey-200 bg-white px-2.5 py-1 text-xs font-semibold text-ey-black transition-colors hover:border-ey-black disabled:opacity-40"
                  >
                    + Attach Invoice Aging Extract (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadHarlowCase}
                    className="rounded bg-ey-charcoal px-2.5 py-1 text-xs font-semibold text-ey-white transition-colors hover:bg-ey-black"
                  >
                    Load Harlow Full Benchmark Case
                  </button>
                </div>
              </div>

              {/* Chat Transcript Stream */}
              <div className="flex flex-1 flex-col gap-5 p-6">
                {visibleMessages.map((message) => {
                  const text = getMessageText(message);
                  const isUser = message.role === "user";
                  const isFileMessage = isUser && isFileUploadMessage(text);

                  return (
                    <div key={message.id} className="animate-message-in flex flex-col gap-1">
                      <span
                        className={`px-1 text-[11px] font-bold tracking-wider text-ey-grey-700 uppercase ${
                          isUser ? "text-right" : "text-left"
                        }`}
                      >
                        {isUser ? "Client AP Manager" : "EY Diagnostic Assistant"}
                      </span>
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        {isFileMessage ? (
                          <FileAttachmentBubble text={text} />
                        ) : (
                          <div
                            className={
                              isUser
                                ? "max-w-[85%] rounded-lg rounded-br-none bg-ey-black px-4 py-3 text-ey-white"
                                : "max-w-[90%] rounded-lg rounded-bl-none border border-ey-grey-200 bg-ey-grey-100/60 px-4 py-3 text-ey-black"
                            }
                          >
                            {isUser ? (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                {text}
                              </p>
                            ) : (
                              <Markdown>{text}</Markdown>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {showTypingIndicator && (
                  <div className="animate-message-in flex flex-col gap-1">
                    <span className="px-1 text-[11px] font-bold tracking-wider text-ey-grey-700 uppercase">
                      EY Diagnostic Assistant
                    </span>
                    <div className="flex justify-start">
                      <div className="rounded-lg rounded-bl-none border border-ey-grey-200 bg-ey-grey-100/60 px-4 py-3">
                        <TypingDots />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="animate-message-in rounded border border-ey-black bg-ey-yellow px-4 py-3 text-sm font-medium text-ey-black">
                    {error.message}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick Answer Chips for rapid testing */}
              {quickChips.length > 0 && !busy && (
                <div className="border-t border-ey-grey-200 bg-ey-grey-100/70 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-bold tracking-wide text-ey-grey-700 uppercase">
                      Quick reply ({nextOpenFixedFieldId}):
                    </span>
                    {quickChips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => sendMessage({ text: chip.text })}
                        className="rounded border border-ey-grey-200 bg-white px-2.5 py-1 text-xs font-medium text-ey-charcoal transition-colors hover:border-ey-black hover:bg-ey-yellow hover:font-semibold hover:text-ey-black"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Composer Bar */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`sticky bottom-0 border-t p-4 transition-colors ${
                  dragActive
                    ? "border-ey-yellow bg-ey-grey-100"
                    : "border-ey-grey-200 bg-white"
                }`}
              >
                {fileError && (
                  <p className="mb-2 text-xs font-semibold text-ey-black">{fileError}</p>
                )}
                {dragActive && (
                  <p className="mb-2 text-xs font-bold tracking-wide text-ey-black uppercase">
                    Drop .txt or .csv client file to extract metrics into checklist
                  </p>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach a .txt or .csv file"
                    title="Attach a .txt or .csv file"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-ey-grey-200 text-ey-grey-700 transition-colors hover:enabled:border-ey-black hover:enabled:text-ey-black disabled:opacity-40"
                  >
                    <AttachIcon />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your response or drop a .txt / .csv extract…"
                    className="flex-1 rounded border border-ey-grey-200 bg-white px-4 py-2.5 text-[15px] text-ey-black outline-none placeholder:text-ey-grey-400 focus:border-ey-black focus:ring-2 focus:ring-ey-yellow"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="rounded bg-ey-yellow px-6 py-2.5 text-sm font-extrabold text-ey-black uppercase transition-all hover:enabled:opacity-90 active:enabled:scale-95 disabled:opacity-40"
                  >
                    {busy ? "…" : "Send"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="flex flex-col gap-4 rounded border border-ey-grey-200 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ey-grey-200 pb-4">
                <div>
                  <span className="font-[var(--font-display)] text-[11px] font-bold tracking-[0.18em] text-ey-grey-700 uppercase">
                    Authoritative V2 Audit · sample-data/ap-data-collection-template-v2.csv
                  </span>
                  <h2 className="mt-1 font-[var(--font-display)] text-xl font-extrabold text-ey-black">
                    22-Field AP Diagnostic Data Checklist
                  </h2>
                  <p className="mt-1 text-xs text-ey-grey-700">
                    Fields are automatically populated from your interview &amp; uploaded files. You can also enter or refine any field directly below.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadHarlowCase}
                    className="rounded bg-ey-yellow px-3.5 py-2 text-xs font-extrabold text-ey-black uppercase transition-opacity hover:opacity-90"
                  >
                    Fill Harlow Reference Data
                  </button>
                  {Object.keys(checklistOverrides).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setChecklistOverrides({})}
                      className="rounded border border-ey-grey-200 bg-white px-3 py-2 text-xs font-bold text-ey-grey-700 uppercase hover:border-ey-black hover:text-ey-black"
                    >
                      Clear Manual Edits
                    </button>
                  )}
                </div>
              </div>

              {/* Tier Filter Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "ALL", label: "All 22 Fields" },
                    { id: 1, label: "Tier 1 · Blocking Root Cause (2)" },
                    { id: 2, label: "Tier 2 · Headline & Control (7)" },
                    { id: 3, label: "Tier 3 · Sizing & Business Case (4)" },
                    { id: 4, label: "Tier 4 · Process Context (9)" },
                  ] as const
                ).map((t) => (
                  <button
                    key={String(t.id)}
                    type="button"
                    onClick={() => setTierFilter(t.id)}
                    className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                      tierFilter === t.id
                        ? "bg-ey-black text-ey-white"
                        : "bg-ey-grey-100 text-ey-grey-700 hover:text-ey-black"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 22-Field Table / Cards */}
              <div className="divide-y divide-ey-grey-200 border border-ey-grey-200">
                {filteredChecklistFields.map((spec) => {
                  const st = diagnosticState.fields[spec.field_id];
                  const currentVal =
                    checklistOverrides[spec.field_id] ??
                    (st?.status === "ANSWERED" ? st.value : "");

                  return (
                    <div
                      key={spec.field_id}
                      className="grid grid-cols-1 gap-3 bg-white p-4 sm:grid-cols-12 sm:items-center"
                    >
                      <div className="sm:col-span-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-ey-charcoal px-2 py-0.5 font-mono text-[11px] font-bold text-ey-yellow">
                            {spec.field_id}
                          </span>
                          <span className="font-[var(--font-display)] text-xs font-extrabold tracking-wide text-ey-black uppercase">
                            {spec.category}
                          </span>
                          <span className="rounded bg-ey-grey-100 px-2 py-0.5 text-[10px] font-bold text-ey-grey-700 uppercase">
                            {spec.tierLabel}
                          </span>
                          <span className="font-mono text-[10px] text-ey-grey-700">
                            {spec.skillOwner}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-ey-black">
                          {spec.question}
                        </p>
                        <p className="mt-0.5 text-xs text-ey-grey-700">
                          Why it matters: {spec.why_it_matters}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5 sm:col-span-5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              st?.status === "ANSWERED"
                                ? "bg-ey-black text-ey-yellow"
                                : st?.status === "PARTIAL"
                                  ? "bg-ey-yellow text-ey-black"
                                  : "bg-ey-grey-100 text-ey-grey-700"
                            }`}
                          >
                            {st?.status ?? "MISSING"}
                          </span>
                          <span className="text-[11px] font-medium text-ey-grey-700">
                            Type: {spec.data_type}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) =>
                            setChecklistOverrides((prev) => ({
                              ...prev,
                              [spec.field_id]: e.target.value,
                            }))
                          }
                          placeholder={spec.placeholder}
                          className="w-full rounded border border-ey-grey-200 bg-ey-grey-100/50 px-3 py-2 text-xs text-ey-black outline-none placeholder:text-ey-grey-400 focus:border-ey-black focus:bg-white focus:ring-2 focus:ring-ey-yellow"
                        />
                        {st?.status === "PARTIAL" && (
                          <p className="text-[11px] font-medium text-ey-charcoal">
                            Note: {st.value}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "benchmarks" && (
            <div className="flex flex-col gap-6">
              {/* 10 Authoritative Benchmarks Table */}
              <div className="rounded border border-ey-grey-200 bg-white p-6 shadow-xs">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="font-[var(--font-display)] text-[11px] font-bold tracking-[0.18em] text-ey-grey-700 uppercase">
                      EY Benchmark Interpreter · sample-data/ap-benchmark-data.csv
                    </span>
                    <h2 className="mt-1 font-[var(--font-display)] text-xl font-extrabold text-ey-black">
                      Live Peer Benchmarking (Global vs. India vs. Client)
                    </h2>
                    <p className="mt-1 text-xs text-ey-grey-700">
                      Ordered along the AP causal chain: PO Coverage → Exception Rate → Cycle Time → Paid on Time &amp; DPO → Discount Capture → Per-FTE Throughput.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadHarlowCase}
                    className="rounded bg-ey-yellow px-3.5 py-2 text-xs font-extrabold text-ey-black uppercase transition-opacity hover:opacity-90"
                  >
                    Load Harlow Benchmark Figures
                  </button>
                </div>

                <div className="overflow-x-auto border border-ey-grey-400">
                  <table className="w-full border-collapse text-left text-xs tabular-nums">
                    <thead>
                      <tr className="bg-ey-yellow text-ey-black">
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Metric
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Unit
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Global
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          India
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Observed
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Client
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2.5 font-[var(--font-display)] font-extrabold uppercase">
                          Position &amp; Diagnostic Read
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkEvaluations.map((ev) => (
                        <tr key={ev.spec.field_id} className="bg-white">
                          <td className="border border-ey-grey-200 px-3 py-2.5 font-bold text-ey-black">
                            {ev.spec.metric}
                            <span className="ml-1.5 font-mono text-[10px] font-normal text-ey-grey-700">
                              ({ev.spec.field_id})
                            </span>
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 text-ey-grey-700">
                            {ev.spec.unit}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 font-semibold text-ey-black">
                            {ev.spec.global_benchmark}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 font-semibold text-ey-black">
                            {ev.spec.india_benchmark}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 text-ey-grey-700">
                            {ev.spec.commonly_observed}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 font-extrabold text-ey-black">
                            {ev.formattedClient}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2.5 text-ey-charcoal">
                            <span
                              className={`mr-2 inline-block rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                ev.position === "ahead"
                                  ? "bg-ey-teal text-white"
                                  : ev.position === "near"
                                    ? "bg-ey-charcoal text-white"
                                    : ev.position === "behind"
                                      ? "bg-ey-yellow text-ey-black"
                                      : "bg-ey-grey-100 text-ey-grey-700"
                              }`}
                            >
                              {ev.positionLabel}
                            </span>
                            <span>{ev.interpretation}</span>
                            {ev.dependencyWarning && (
                              <p className="mt-1 font-semibold text-ey-black">
                                ↳ {ev.dependencyWarning}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extract File-Reader & Cross-Tabulation Section */}
              <div className="rounded border border-ey-grey-200 bg-white p-6 shadow-xs">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="font-[var(--font-display)] text-[11px] font-bold tracking-[0.18em] text-ey-grey-700 uppercase">
                      EY File-Reader Skill · skills/file-reader/SKILL.md
                    </span>
                    <h3 className="mt-1 font-[var(--font-display)] text-lg font-extrabold text-ey-black">
                      Invoice Aging Extract Arithmetic &amp; Causal Cross-Tabulation
                    </h3>
                  </div>
                  {!diagnosticState.extractAnalysis && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleInjectSampleFile(
                          SAMPLE_EXTRACT_FILENAME,
                          SAMPLE_EXTRACT_CONTENT,
                        )
                      }
                      className="rounded bg-ey-black px-3.5 py-2 text-xs font-bold text-ey-white uppercase hover:bg-ey-charcoal"
                    >
                      Load 10-Row Sample Extract (.csv)
                    </button>
                  )}
                </div>

                {!diagnosticState.extractAnalysis ? (
                  <p className="rounded bg-ey-grey-100 p-4 text-xs text-ey-grey-700">
                    No invoice aging CSV extract has been attached yet. Click{" "}
                    <strong>&ldquo;Load 10-Row Sample Extract (.csv)&rdquo;</strong> above or drop a CSV file in the interview tab to compute PO vs. non-PO cross-tabulations and vendor concentration.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {diagnosticState.extractAnalysis.isSmallSample && (
                      <div className="border-l-4 border-ey-yellow bg-ey-grey-light px-4 py-3 text-xs text-ey-black">
                        <strong>Sample-Size &amp; Cycle-Time Caveat (file-reader rule):</strong>{" "}
                        Computed across <strong>n = {diagnosticState.extractAnalysis.rowCount} rows</strong>. Treat rates as indicative of the sample rather than the full monthly population until verified against the full close extract. Note that{" "}
                        <code>days_to_approval</code> ({diagnosticState.extractAnalysis.avgApprovalDays}d) is a single step and a lower bound for end-to-end receipt-to-posting cycle time (<code>ap_09</code>).
                      </div>
                    )}

                    {/* Cross-tabulation proving causal link between PO status and Exception Rate / Approval Days */}
                    <div>
                      <h4 className="mb-2 font-[var(--font-display)] text-xs font-extrabold tracking-wider text-ey-black uppercase">
                        Cross-Tabulation: PO-Backed vs. Non-PO Invoices
                      </h4>
                      <div className="overflow-x-auto border border-ey-grey-400">
                        <table className="w-full border-collapse text-left text-xs tabular-nums">
                          <thead>
                            <tr className="bg-ey-yellow text-ey-black">
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Cohort
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Invoice Rows
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Exception Rate (ap_08)
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Mean Approval Time
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Paid on Time (ap_11)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white">
                              <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                PO-Backed Invoices
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2">
                                {diagnosticState.extractAnalysis.crossTab.poBacked.count} /{" "}
                                {diagnosticState.extractAnalysis.rowCount} (
                                {diagnosticState.extractAnalysis.poBackedPct}%)
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2 font-semibold">
                                {diagnosticState.extractAnalysis.crossTab.poBacked.exceptionPct}% (
                                {diagnosticState.extractAnalysis.crossTab.poBacked.exceptionCount}/
                                {diagnosticState.extractAnalysis.crossTab.poBacked.count})
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2">
                                {diagnosticState.extractAnalysis.crossTab.poBacked.avgApprovalDays} days
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2 font-semibold">
                                {diagnosticState.extractAnalysis.crossTab.poBacked.paidOnTimePct}% (
                                {diagnosticState.extractAnalysis.crossTab.poBacked.paidOnTimeCount}/
                                {diagnosticState.extractAnalysis.crossTab.poBacked.count})
                              </td>
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                Non-PO Invoices
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2">
                                {diagnosticState.extractAnalysis.crossTab.nonPo.count} /{" "}
                                {diagnosticState.extractAnalysis.rowCount} (
                                {100 - diagnosticState.extractAnalysis.poBackedPct}%)
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                {diagnosticState.extractAnalysis.crossTab.nonPo.exceptionPct}% (
                                {diagnosticState.extractAnalysis.crossTab.nonPo.exceptionCount}/
                                {diagnosticState.extractAnalysis.crossTab.nonPo.count})
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                {diagnosticState.extractAnalysis.crossTab.nonPo.avgApprovalDays} days
                              </td>
                              <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                {diagnosticState.extractAnalysis.crossTab.nonPo.paidOnTimePct}% (
                                {diagnosticState.extractAnalysis.crossTab.nonPo.paidOnTimeCount}/
                                {diagnosticState.extractAnalysis.crossTab.nonPo.count})
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Vendor Spend Concentration */}
                    <div>
                      <h4 className="mb-2 font-[var(--font-display)] text-xs font-extrabold tracking-wider text-ey-black uppercase">
                        Supplementary: Vendor Spend Concentration (Total INR{" "}
                        {diagnosticState.extractAnalysis.totalAmountInr.toLocaleString()})
                      </h4>
                      <div className="overflow-x-auto border border-ey-grey-400">
                        <table className="w-full border-collapse text-left text-xs tabular-nums">
                          <thead>
                            <tr className="bg-ey-yellow text-ey-black">
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Vendor
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Invoices
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                PO-Backed Rows
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Spend (INR)
                              </th>
                              <th className="border border-ey-grey-400 px-3 py-2 font-extrabold uppercase">
                                Share of Extract Spend
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {diagnosticState.extractAnalysis.vendorConcentration.map((v) => (
                              <tr key={v.vendor} className="bg-white">
                                <td className="border border-ey-grey-200 px-3 py-2 font-semibold text-ey-black">
                                  {v.vendor}
                                </td>
                                <td className="border border-ey-grey-200 px-3 py-2">
                                  {v.invoiceCount}
                                </td>
                                <td className="border border-ey-grey-200 px-3 py-2">
                                  {v.poBackedCount} / {v.invoiceCount}
                                </td>
                                <td className="border border-ey-grey-200 px-3 py-2">
                                  ₹{v.amountInr.toLocaleString()}
                                </td>
                                <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                                  {v.sharePct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Diagnostic Status & Causal Metrics Sidebar (4 cols on lg) */}
        <aside className="flex flex-col gap-5 lg:col-span-4">
          {/* Readiness & Progress Card */}
          <div className="rounded border border-ey-grey-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-[var(--font-display)] text-xs font-extrabold tracking-wider text-ey-black uppercase">
                Diagnostic Readiness Gate
              </span>
              <span className="font-mono text-xs font-bold text-ey-charcoal tabular-nums">
                {diagnosticState.answeredCount} / 22 fields
              </span>
            </div>

            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ey-grey-100">
              <div
                className="h-full bg-ey-yellow transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((diagnosticState.answeredCount / 22) * 100))}%`,
                }}
              />
            </div>

            <div className="mt-3 rounded bg-ey-grey-100 p-3">
              <p className="font-[var(--font-display)] text-xs font-extrabold text-ey-black uppercase">
                {diagnosticState.readinessVerdict}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ey-grey-700">
                {diagnosticState.readinessDetail}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={!isReportReady}
              className={`mt-4 w-full rounded py-3 text-xs font-extrabold tracking-wider uppercase transition-all ${
                isReportReady
                  ? "bg-ey-yellow text-ey-black hover:opacity-90"
                  : "cursor-not-allowed bg-ey-grey-200 text-ey-grey-700"
              }`}
            >
              {isReportReady
                ? "Generate 6-Section Diagnostic Report →"
                : "Complete Tier 1 Metrics to Unlock Report"}
            </button>
          </div>

          {/* Live 9 Fixed Interview Metrics Tracker */}
          <div className="rounded border border-ey-grey-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-[var(--font-display)] text-xs font-extrabold tracking-wider text-ey-black uppercase">
                Core Causal Chain Metrics (9)
              </span>
              <span className="text-xs font-bold text-ey-grey-700 tabular-nums">
                {fixedAnsweredCount}/9 captured
              </span>
            </div>

            <div className="divide-y divide-ey-grey-200 border-t border-ey-grey-200">
              {FIXED_INTERVIEW_FIELD_IDS.map((fid, idx) => {
                const spec = AP_CHECKLIST_FIELDS.find((f) => f.field_id === fid)!;
                const st = diagnosticState.fields[fid];
                const isDone = st?.status === "ANSWERED";
                const isPartial = st?.status === "PARTIAL";

                return (
                  <div key={fid} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-bold ${
                          isDone
                            ? "bg-ey-black text-ey-yellow"
                            : isPartial
                              ? "bg-ey-yellow text-ey-black"
                              : "bg-ey-grey-100 text-ey-grey-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-ey-black">{spec.shortLabel}</p>
                        <p className="font-mono text-[10px] text-ey-grey-700">{fid}</p>
                      </div>
                    </div>
                    <span
                      className={`max-w-[135px] truncate text-right font-mono text-[11px] font-bold tabular-nums ${
                        isDone ? "text-ey-black" : "text-ey-grey-400"
                      }`}
                      title={st?.value}
                    >
                      {isDone
                        ? st.numericValue !== undefined
                          ? `${st.numericValue}${spec.unit === "%" ? "%" : spec.unit ? ` ${spec.unit}` : ""}`
                          : st.value
                        : isPartial
                          ? "Partial"
                          : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Derived Productivity & Control Highlights */}
          <div className="rounded border border-ey-grey-200 bg-ey-charcoal p-5 text-ey-white">
            <span className="font-[var(--font-display)] text-[10px] font-bold tracking-[0.18em] text-ey-yellow uppercase">
              Computed Benchmark Readout
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3 tabular-nums">
              <div className="rounded bg-ey-black/50 p-3">
                <p className="text-[11px] text-ey-grey-200">Invoices / FTE p.a.</p>
                <p className="mt-1 font-[var(--font-display)] text-lg font-black text-ey-yellow">
                  {benchmarkEvaluations.find((e) => e.spec.field_id === "ap_derived")
                    ?.formattedClient ?? "—"}
                </p>
                <p className="text-[10px] text-ey-grey-400">India: 40k · Global: 44k</p>
              </div>
              <div className="rounded bg-ey-black/50 p-3">
                <p className="text-[11px] text-ey-grey-200">Queries / 1k Inv</p>
                <p className="mt-1 font-[var(--font-display)] text-lg font-black text-ey-yellow">
                  {benchmarkEvaluations.find((e) => e.spec.field_id === "ap_17")
                    ?.clientValue ?? "—"}
                </p>
                <p className="text-[10px] text-ey-grey-400">India: 40 · Global: 15</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ReportPanel
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        status={reportStatus}
        text={reportText}
        clientName={clientName}
      />
    </div>
  );
}

function FileAttachmentBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const newlineIndex = text.indexOf("\n");
  const label = newlineIndex === -1 ? text : text.slice(0, newlineIndex);
  const body = newlineIndex === -1 ? "" : text.slice(newlineIndex + 1);
  const preview = body.length > 400 ? `${body.slice(0, 400)}…` : body;

  return (
    <div className="max-w-[85%] rounded-lg rounded-br-none bg-ey-black px-4 py-3 text-ey-white">
      <p className="mb-1 text-[13px] font-semibold text-ey-yellow">{label}</p>
      <pre className="max-h-64 overflow-y-auto rounded bg-ey-charcoal p-3 font-mono text-[12px] whitespace-pre-wrap text-ey-grey-200">
        {expanded ? body : preview}
      </pre>
      {body.length > 400 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[12px] font-semibold text-ey-yellow underline underline-offset-2"
        >
          {expanded ? "Show less" : "Show full file"}
        </button>
      )}
    </div>
  );
}

function AttachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

