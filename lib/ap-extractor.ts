import {
  AP_CHECKLIST_FIELDS,
  analyzeInvoiceExtractCsv,
  type ExtractAnalysisResult,
  type FieldStatus,
  type NumericMetricsMap,
} from "./ap-diagnostic-data";

export interface ExtractedFieldState {
  field_id: string;
  status: FieldStatus;
  value: string;
  numericValue?: number;
  source: "interview" | "file-upload" | "checklist-input";
}

export interface DiagnosticExtractionState {
  fields: Record<string, ExtractedFieldState>;
  metrics: NumericMetricsMap;
  extractAnalysis: ExtractAnalysisResult | null;
  answeredCount: number;
  partialCount: number;
  missingCount: number;
  readinessVerdict:
    | "Not enough data to diagnose"
    | "Enough to diagnose, thin in places"
    | "Ready for a report";
  readinessDetail: string;
}

const QUESTION_SIGNATURES: Array<{ fieldId: string; pattern: RegExp }> = [
  { fieldId: "ap_03", pattern: /invoices does the team process in a typical month|monthly invoice volume/i },
  { fieldId: "ap_04", pattern: /percentage of invoices are PO-backed|PO-backed versus non-PO/i },
  { fieldId: "ap_08", pattern: /hit an exception and need manual resolution|exception rate/i },
  { fieldId: "ap_09", pattern: /invoice is received to when it's fully posted|receipt to posting/i },
  { fieldId: "ap_11", pattern: /paid on time against agreed terms/i },
  { fieldId: "ap_10", pattern: /average Days Payable Outstanding|\bDPO\b/i },
  { fieldId: "ap_14", pattern: /eligible early-payment discounts do you actually capture|discount capture/i },
  { fieldId: "ap_17", pattern: /vendor queries does the team handle in a month/i },
  { fieldId: "ap_19", pattern: /FTEs work in the AP function today|how many FTEs/i },
];

export function parseFirstNumber(text: string): number | undefined {
  // Handle ranges like "15-20%" or "3-4 days" -> midpoint
  const rangeMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|thousand)?/i);
  if (rangeMatch) {
    const a = Number(rangeMatch[1].replace(/,/g, ""));
    const b = Number(rangeMatch[2].replace(/,/g, ""));
    const mult = rangeMatch[3] ? 1000 : 1;
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return Math.round(((a + b) / 2) * mult * 10) / 10;
    }
  }

  const numMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|thousand)?/i);
  if (!numMatch) return undefined;
  const base = Number(numMatch[1].replace(/,/g, ""));
  if (Number.isNaN(base)) return undefined;
  const mult = numMatch[2] ? 1000 : 1;
  return base * mult;
}

function detectAskedFieldId(assistantText: string): string | undefined {
  // Check reverse order of appearance in the assistant text so if the assistant
  // acknowledged an earlier topic and then asked a new question at the end, we
  // match the question at the end.
  let bestField: string | undefined;
  let bestIndex = -1;

  for (const sig of QUESTION_SIGNATURES) {
    const match = sig.pattern.exec(assistantText);
    if (match && match.index > bestIndex) {
      bestIndex = match.index;
      bestField = sig.fieldId;
    }
  }
  return bestField;
}

function scanFreeformText(
  text: string,
  source: "interview" | "file-upload",
  setField: (fieldId: string, status: FieldStatus, value: string, num?: number, src?: "interview" | "file-upload") => void,
) {
  // 0. Structured checklist override lines: - [ap_XX] Label: value
  const structuredMatches = text.matchAll(/^-\s*\[(ap_\d+)\]\s*[^:]+:\s*(.+)$/gm);
  for (const m of structuredMatches) {
    const fid = m[1];
    const val = m[2].trim();
    if (val) {
      const num = parseFirstNumber(val);
      setField(fid, "ANSWERED", val, num, source);
    }
  }

  // 1. Invoice volume (ap_03)
  const volMatch = text.match(/(?:processed|process|handle|around|roughly|about)\s+(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand)?)\s+(?:vendor\s+)?invoices/i)
    ?? text.match(/(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand)?)\s+invoices\s+(?:in\s+\w+|per\s+month|a\s+month|monthly)/i);
  if (volMatch) {
    const num = parseFirstNumber(volMatch[1]);
    if (num && num >= 50) {
      setField("ap_03", "ANSWERED", `${num.toLocaleString()} invoices/month`, num, source);
    }
  }

  // 2. Non-PO or PO-backed share (ap_04)
  const nonPoMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:do not have a PO|are non-PO|without a PO|non-PO)/i);
  if (nonPoMatch) {
    const nonPo = Number(nonPoMatch[1]);
    const poBacked = Math.max(0, Math.min(100, 100 - nonPo));
    setField(
      "ap_04",
      "ANSWERED",
      `${poBacked}% PO-backed (inverted from ${nonPo}% non-PO stated)`,
      poBacked,
      source,
    );
  } else {
    const poMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:are\s+)?PO[- ]backed/i)
      ?? text.match(/PO\s+coverage\s+(?:is\s+|of\s+|at\s+)?(\d+(?:\.\d+)?)\s*%/i);
    if (poMatch) {
      const poBacked = Number(poMatch[1]);
      setField("ap_04", "ANSWERED", `${poBacked}% PO-backed`, poBacked, source);
    }
  }

  // 3. OCR & Intake Channel (ap_05, ap_06)
  if (/OCR\s+turned\s+on|use\s+OCR|OCR\s+in\s+place/i.test(text)) {
    setField(
      "ap_06",
      "ANSWERED",
      "Yes — OCR enabled for scanned invoices (email PDFs still require manual keying)",
      undefined,
      source,
    );
  }
  if (/PDF\s+attachments\s+in\s+email|scanned\s+invoices|EDI|vendor\s+portal/i.test(text)) {
    setField(
      "ap_05",
      "ANSWERED",
      "Mix of scanned invoices (OCR) and email PDF attachments keyed manually",
      undefined,
      source,
    );
  }

  // 4. Exception rate (ap_08)
  const excMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:exception\s+rate|exceptions|hit\s+an\s+exception)/i)
    ?? text.match(/exception\s+rate\s+(?:is\s+|of\s+|at\s+|around\s+)?(\d+(?:\.\d+)?)\s*%/i);
  if (excMatch) {
    const exc = Number(excMatch[1]);
    setField("ap_08", "ANSWERED", `${exc}% exception rate`, exc, source);
  }

  // 5. Receipt-to-posting cycle time (ap_09)
  const cycleMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-\s*\d+\s*)?days?\s*(?:receipt[- ]to[- ]posting|cycle\s+time|from\s+receipt\s+to\s+posting)/i)
    ?? text.match(/(?:receipt[- ]to[- ]posting|cycle\s+time)\s+(?:is\s+|of\s+|takes\s+|around\s+)?(\d+(?:\.\d+)?)\s*days/i);
  if (cycleMatch) {
    const days = parseFirstNumber(cycleMatch[0]);
    if (days !== undefined) {
      setField("ap_09", "ANSWERED", `${days} days receipt-to-posting`, days, source);
    }
  }

  // 6. DPO (ap_10)
  const dpoMatch = text.match(/(?:DPO|Days\s+Payable\s+Outstanding)\s+(?:is\s+|of\s+|at\s+|around\s+)?(\d+(?:\.\d+)?)\s*(?:days)?/i)
    ?? text.match(/(\d+(?:\.\d+)?)\s*days\s+(?:DPO|Days\s+Payable\s+Outstanding)/i);
  if (dpoMatch) {
    const dpo = Number(dpoMatch[1]);
    setField("ap_10", "ANSWERED", `${dpo} days DPO`, dpo, source);
  }

  // 7. Paid on time (ap_11)
  const otpMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+invoices\s+)?(?:are\s+)?paid\s+on\s+time/i)
    ?? text.match(/paid\s+on\s+time\s+(?:is\s+|of\s+|at\s+|around\s+)?(\d+(?:\.\d+)?)\s*%/i);
  if (otpMatch) {
    const otp = Number(otpMatch[1]);
    setField("ap_11", "ANSWERED", `${otp}% paid on time`, otp, source);
  }

  // 8. Electronic payments (ap_12)
  const elecMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:electronic|electronically)/i);
  if (elecMatch) {
    const elec = Number(elecMatch[1]);
    setField("ap_12", "ANSWERED", `${elec}% electronic payments`, elec, source);
  }

  // 9. Payment terms count (ap_13)
  const termsMatch = text.match(/(\d+)\s+(?:distinct\s+|different\s+|unique\s+)?payment\s+terms/i);
  if (termsMatch) {
    const terms = Number(termsMatch[1]);
    setField("ap_13", "ANSWERED", `${terms} distinct payment terms`, terms, source);
  }

  // 10. Early payment discount capture (ap_14)
  const discMatch = text.match(/discount\s+capture\s+(?:is\s+|of\s+|at\s+|around\s+|sits\s+at\s+)?(\d+(?:\.\d+)?)\s*%/i)
    ?? text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+eligible\s+)?(?:early[- ]payment\s+)?discounts?\s+(?:captured|capture)/i);
  if (discMatch) {
    const disc = Number(discMatch[1]);
    setField("ap_14", "ANSWERED", `${disc}% discount capture`, disc, source);
  } else if (/don't have an exact number for discount capture|miss a lot of early payment/i.test(text)) {
    setField(
      "ap_14",
      "PARTIAL",
      "Qualitative only ('miss a lot of early payment terms due to approval delay') — percentage estimate still needed",
      undefined,
      source,
    );
  }

  // 11. Approval steps (ap_15)
  if (/sign-off from both|cost center head|finance controller/i.test(text)) {
    setField(
      "ap_15",
      "ANSWERED",
      "Dual sign-off above 50k INR (Cost Center Head + Finance Controller; controller travel adds 3–4 days)",
      undefined,
      source,
    );
    setField(
      "ap_20",
      "ANSWERED",
      "40% non-PO invoices from facilities/marketing + Finance Controller approval bottleneck adding 3–4 days",
      undefined,
      source,
    );
  }

  // 12. Vendor queries (ap_17)
  const queryMatch = text.match(/(\d[\d,]*)\s*(?:vendor\s+)?queries\s+(?:per\s+month|a\s+month|monthly|per\s+1,?000\s+invoices)/i);
  if (queryMatch) {
    const q = Number(queryMatch[1].replace(/,/g, ""));
    setField("ap_17", "ANSWERED", `${q} vendor queries`, q, source);
  }

  // 13. FTEs (ap_19)
  const fteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:AP\s+)?FTEs?/i);
  if (fteMatch) {
    const ftes = Number(fteMatch[1]);
    setField("ap_19", "ANSWERED", `${ftes} FTEs`, ftes, source);
  }
}

export function extractDiagnosticState(
  messages: Array<{ role: string; text: string }>,
  manualOverrides: Record<string, string> = {},
): DiagnosticExtractionState {
  const fields: Record<string, ExtractedFieldState> = {};
  const metrics: NumericMetricsMap = {};
  let extractAnalysis: ExtractAnalysisResult | null = null;

  for (const spec of AP_CHECKLIST_FIELDS) {
    fields[spec.field_id] = {
      field_id: spec.field_id,
      status: "MISSING",
      value: "",
      source: "interview",
    };
  }

  const setField = (
    fieldId: string,
    status: FieldStatus,
    value: string,
    num?: number,
    source: "interview" | "file-upload" | "checklist-input" = "interview",
  ) => {
    const current = fields[fieldId];
    if (!current) return;
    // Do not downgrade an ANSWERED field to PARTIAL
    if (current.status === "ANSWERED" && status === "PARTIAL") return;

    fields[fieldId] = {
      field_id: fieldId,
      status,
      value,
      numericValue: num ?? current.numericValue,
      source,
    };

    if (num !== undefined && !Number.isNaN(num)) {
      metrics[fieldId as keyof NumericMetricsMap] = num;
    }
  };

  let lastAskedFieldId: string | undefined;

  for (const msg of messages) {
    if (msg.role === "assistant") {
      const asked = detectAskedFieldId(msg.text);
      if (asked) lastAskedFieldId = asked;
      continue;
    }

    if (msg.role === "user") {
      const text = msg.text.trim();
      if (!text) continue;

      if (text.startsWith("[Uploaded file:")) {
        const newlineIdx = text.indexOf("\n");
        const body = newlineIdx === -1 ? "" : text.slice(newlineIdx + 1);
        const csvResult = analyzeInvoiceExtractCsv(body);

        if (csvResult) {
          extractAnalysis = csvResult;
          const sampleNote = csvResult.isSmallSample
            ? ` (indicative sample, n=${csvResult.rowCount} rows)`
            : ` (n=${csvResult.rowCount} rows)`;

          setField(
            "ap_04",
            "ANSWERED",
            `${csvResult.poBackedPct}% PO-backed (${csvResult.poBackedCount}/${csvResult.rowCount} rows)${sampleNote}`,
            csvResult.poBackedPct,
            "file-upload",
          );
          setField(
            "ap_08",
            "ANSWERED",
            `${csvResult.exceptionRatePct}% exception rate (${csvResult.exceptionCount}/${csvResult.rowCount} rows)${sampleNote}`,
            csvResult.exceptionRatePct,
            "file-upload",
          );
          setField(
            "ap_11",
            "ANSWERED",
            `${csvResult.paidOnTimePct}% paid on time (${csvResult.paidOnTimeCount}/${csvResult.rowCount} rows)${sampleNote}`,
            csvResult.paidOnTimePct,
            "file-upload",
          );
          // Per file-reader/SKILL.md: days_to_approval is approval time (a lower bound of ap_09),
          // and ap_09 allows an approval-time figure if that's what is tracked.
          if (fields.ap_09.status !== "ANSWERED") {
            setField(
              "ap_09",
              "ANSWERED",
              `${csvResult.avgApprovalDays} days mean approval time (lower bound for receipt-to-posting${sampleNote})`,
              csvResult.avgApprovalDays,
              "file-upload",
            );
          }
        } else {
          scanFreeformText(body, "file-upload", setField);
        }
        continue;
      }

      // Scan freeform text for any multi-metric answers
      scanFreeformText(text, "interview", setField);

      // Also attribute directly to the question the assistant just asked
      if (lastAskedFieldId) {
        const spec = AP_CHECKLIST_FIELDS.find((f) => f.field_id === lastAskedFieldId);
        const num = parseFirstNumber(text);

        if (spec) {
          const isNumericField =
            spec.data_type === "number" ||
            spec.data_type === "percentage" ||
            spec.data_type === "number (days)";

          if (isNumericField) {
            if (num !== undefined) {
              // Special handling if the user answered ap_04 with "40% non-PO"
              let finalNum = num;
              if (
                lastAskedFieldId === "ap_04" &&
                /non-po|without\s+a?\s*po/i.test(text) &&
                !/po[- ]backed/i.test(text) &&
                num <= 100
              ) {
                finalNum = 100 - num;
              }
              const unitSuffix =
                spec.unit === "%" ? "%" : spec.unit ? ` ${spec.unit}` : "";
              setField(
                lastAskedFieldId,
                "ANSWERED",
                `${finalNum}${unitSuffix} (${text.slice(0, 80)})`,
                finalNum,
                "interview",
              );
            } else if (fields[lastAskedFieldId].status === "MISSING") {
              setField(
                lastAskedFieldId,
                "PARTIAL",
                `Qualitative response ("${text.slice(0, 70)}") — numeric figure or range needed`,
                undefined,
                "interview",
              );
            }
          } else {
            setField(lastAskedFieldId, "ANSWERED", text, undefined, "interview");
          }
        }
      }
    }
  }

  // Apply manual overrides from the 22-field checklist UI or preset scenarios
  for (const [fieldId, rawVal] of Object.entries(manualOverrides)) {
    const trimmed = rawVal.trim();
    if (!trimmed) continue;
    const num = parseFirstNumber(trimmed);
    setField(fieldId, "ANSWERED", trimmed, num, "checklist-input");
  }

  let answeredCount = 0;
  let partialCount = 0;
  let missingCount = 0;

  for (const f of Object.values(fields)) {
    if (f.status === "ANSWERED") answeredCount++;
    else if (f.status === "PARTIAL") partialCount++;
    else missingCount++;
  }

  // Readiness gate per context/skills/data-checklist/SKILL.md:
  // - Tier 1 blocking: ap_04 and ap_08
  // - Tier 2 headline: ap_03, ap_09, ap_11, ap_19
  const tier1Complete =
    fields.ap_04?.status === "ANSWERED" && fields.ap_08?.status === "ANSWERED";
  const tier2CoreComplete =
    tier1Complete &&
    fields.ap_03?.status === "ANSWERED" &&
    fields.ap_09?.status === "ANSWERED" &&
    fields.ap_11?.status === "ANSWERED" &&
    fields.ap_19?.status === "ANSWERED";

  let readinessVerdict: DiagnosticExtractionState["readinessVerdict"];
  let readinessDetail: string;

  if (!tier1Complete) {
    const missingT1 = [
      fields.ap_04?.status !== "ANSWERED" ? "PO-backed share (ap_04)" : null,
      fields.ap_08?.status !== "ANSWERED" ? "Exception rate (ap_08)" : null,
    ].filter(Boolean);
    readinessVerdict = "Not enough data to diagnose";
    readinessDetail = `Blocking Tier 1 field(s) still needed: ${missingT1.join(" and ")}. Without these, root cause cannot be separated from symptoms.`;
  } else if (!tier2CoreComplete) {
    readinessVerdict = "Enough to diagnose, thin in places";
    readinessDetail =
      "Tier 1 root-cause metrics (PO coverage & exception rate) are in hand. Completing volume, FTEs, cycle time, and paid-on-time will sharpen the full benchmark table.";
  } else {
    readinessVerdict = "Ready for a report";
    readinessDetail =
      "Core Tier 1 and Tier 2 diagnostic metrics are established. Ready to generate the six-section benchmarked diagnostic report.";
  }

  return {
    fields,
    metrics,
    extractAnalysis,
    answeredCount,
    partialCount,
    missingCount,
    readinessVerdict,
    readinessDetail,
  };
}
