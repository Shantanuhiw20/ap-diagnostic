"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { EyHeader } from "@/components/EyHeader";
import { Markdown } from "@/components/Markdown";
import { TypingDots } from "@/components/TypingDots";
import { ReportPanel, type ReportStatus } from "@/components/ReportPanel";
import { getMessageText } from "@/lib/message-text";

const ACCEPTED_FILE_TYPES = ".txt,.csv,text/plain,text/csv";
const MAX_FILE_CHARS = 500_000; // generous cap so a real extract fits, without letting a huge file blow up the prompt
const FILE_UPLOAD_PREFIX = "[Uploaded file:";
// The system prompt instructs the agent to use this exact phrase once it has
// what it needs. Detecting it is how the client knows the interview is
// actually done, this is a semantic judgment only the model can make.
const REPORT_READY_PATTERN = /generate report/i;

function buildFileMessageText(fileName: string, content: string): string {
  const truncated = content.length > MAX_FILE_CHARS;
  const body = truncated ? content.slice(0, MAX_FILE_CHARS) : content;
  const suffix = truncated ? "\n\n[truncated, file was larger than the size this interview can accept]" : "";
  return `${FILE_UPLOAD_PREFIX} ${fileName}]\n${body}${suffix}`;
}

function isFileUploadMessage(text: string): boolean {
  return text.startsWith(FILE_UPLOAD_PREFIX);
}

export default function ChatClient({
  openingText,
  clientName,
}: {
  openingText: string;
  clientName?: string;
}) {
  // Bumping this remounts ChatSession from scratch: a fresh useChat instance,
  // fresh report state, back to the opening message. That's "New Chat".
  const [sessionKey, setSessionKey] = useState(0);

  return (
    <ChatSession
      key={sessionKey}
      openingText={openingText}
      clientName={clientName}
      onNewChat={() => setSessionKey((k) => k + 1)}
    />
  );
}

function ChatSession({
  openingText,
  clientName,
  onNewChat,
}: {
  openingText: string;
  clientName?: string;
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

  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<ReportStatus>("idle");
  const [reportText, setReportText] = useState("");
  const reportRequestId = useRef(0);

  // Auto-scroll: the page itself scrolls (header/composer are sticky within
  // normal document flow, there's no dedicated overflow container), so this
  // scrolls the window, not some inner div.
  //
  // A "only scroll if the user is already near the bottom" version was
  // tried first, using a scroll-event listener to track that. It doesn't
  // work here: our own scrollIntoView call fires a native 'scroll' event,
  // and while content is still streaming in, scrollHeight keeps growing, so
  // that self-triggered event measures "not near the bottom any more" and
  // latches auto-scroll off for the rest of the turn. Unconditional is what
  // was actually asked for anyway.
  const bottomRef = useRef<HTMLDivElement>(null);

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

    const isAccepted = /\.(txt|csv)$/i.test(file.name) || file.type === "text/plain" || file.type === "text/csv";
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

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-uploading the same file name later
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
        body: JSON.stringify({ messages, clientName }),
      });

      if (!res.ok || !res.body) throw new Error(`Report request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // A stale request (panel re-opened, user regenerated) shouldn't
        // keep writing into state after a newer one has started.
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
    !!lastMessage && lastMessage.role === "assistant" && getMessageText(lastMessage).trim() === "";
  const showTypingIndicator = busy && (!lastMessage || lastMessage.role !== "assistant" || lastMessageIsEmptyAssistant);

  // While the assistant's reply is still empty, the dedicated typing
  // indicator below represents that turn. Rendering the (still blank)
  // message bubble from `messages` at the same time would show the same
  // turn twice, once as an empty static bubble, once as the animated dots.
  const visibleMessages =
    busy && lastMessageIsEmptyAssistant ? messages.slice(0, -1) : messages;

  const isReportReady = messages.some(
    (m) => m.role === "assistant" && REPORT_READY_PATTERN.test(getMessageText(m)),
  );

  // `messages` is a new array/object on every streamed chunk (useChat
  // updates immutably), so this fires during streaming too, not just when a
  // whole new message is added.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages, showTypingIndicator]);

  return (
    <div className="flex min-h-screen flex-col bg-ey-grey-100 text-ey-black">
      <EyHeader subtitle="AP Diagnostic Interview">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wide text-ey-black uppercase shadow-sm transition-colors hover:bg-ey-grey-100"
          >
            New Chat
          </button>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={!isReportReady}
            title={
              isReportReady
                ? undefined
                : "Available once the assistant confirms it has what it needs for a first-pass report"
            }
            className={
              isReportReady
                ? "rounded-full border-2 border-ey-black bg-ey-yellow px-5 py-2 text-xs font-bold tracking-wide text-ey-black uppercase shadow-sm transition-opacity hover:opacity-90"
                : "cursor-not-allowed rounded-full border-2 border-ey-grey-400 bg-ey-grey-400 px-5 py-2 text-xs font-bold tracking-wide text-ey-grey-700 uppercase shadow-sm"
            }
          >
            Generate Report
          </button>
        </div>
      </EyHeader>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
        {visibleMessages.map((message) => {
          const text = getMessageText(message);
          const isUser = message.role === "user";
          const isFileMessage = isUser && isFileUploadMessage(text);

          return (
            <div key={message.id} className="animate-message-in flex flex-col gap-1">
              <span
                className={`px-1 text-[11px] font-semibold tracking-wide text-ey-grey-400 uppercase ${
                  isUser ? "text-right" : "text-left"
                }`}
              >
                {isUser ? "You" : "EY Assistant"}
              </span>
              <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {isFileMessage ? (
                  <FileAttachmentBubble text={text} />
                ) : (
                  <div
                    className={
                      isUser
                        ? "max-w-[80%] rounded-2xl rounded-br-sm bg-ey-black px-4 py-3 text-ey-white"
                        : "max-w-[85%] rounded-2xl rounded-bl-sm border border-ey-grey-200 bg-white px-4 py-3 text-ey-black"
                    }
                  >
                    {isUser ? (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
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
            <span className="px-1 text-[11px] font-semibold tracking-wide text-ey-grey-400 uppercase">
              EY Assistant
            </span>
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-ey-grey-200 bg-white px-4 py-3">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-message-in rounded-lg border border-ey-black bg-ey-yellow px-4 py-3 text-sm font-medium text-ey-black">
            {error.message}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`sticky bottom-0 border-t bg-white px-6 py-4 transition-colors ${
          dragActive ? "border-ey-yellow bg-ey-grey-100" : "border-ey-grey-200"
        }`}
      >
        <div className="mx-auto max-w-3xl">
          {fileError && <p className="mb-2 text-xs font-medium text-ey-grey-700">{fileError}</p>}
          {dragActive && (
            <p className="mb-2 text-xs font-semibold tracking-wide text-ey-grey-700 uppercase">
              Drop .txt or .csv to attach
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ey-grey-200 text-ey-grey-700 transition-colors hover:enabled:border-ey-black hover:enabled:text-ey-black disabled:opacity-40"
            >
              <AttachIcon />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              className="flex-1 rounded-full border border-ey-grey-200 bg-white px-5 py-3 text-[15px] text-ey-black outline-none placeholder:text-ey-grey-400 focus:border-ey-black focus:ring-2 focus:ring-ey-yellow"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-ey-yellow px-6 py-3 text-sm font-bold text-ey-black transition-all hover:enabled:opacity-90 active:enabled:scale-95 disabled:opacity-40"
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>
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
    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-ey-black px-4 py-3 text-ey-white">
      <p className="mb-1 text-[13px] font-semibold text-ey-yellow">{label}</p>
      <pre className="max-h-64 overflow-y-auto rounded-lg bg-ey-charcoal p-3 font-mono text-[12px] whitespace-pre-wrap text-ey-grey-200">
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
