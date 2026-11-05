import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Message,
  LanguageModelV4StreamPart,
  LanguageModelV4TextPart,
} from "@ai-sdk/provider";
import {
  AP_CHECKLIST_FIELDS,
  FIXED_INTERVIEW_FIELD_IDS,
  evaluateAllBenchmarks,
  analyzeInvoiceExtractCsv,
} from "@/lib/ap-diagnostic-data";
import { extractDiagnosticState } from "@/lib/ap-extractor";

function flattenText(parts: Array<LanguageModelV4TextPart | { type: string }>): string {
  return parts
    .filter((part): part is LanguageModelV4TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function extractMessages(prompt: LanguageModelV4Message[]): {
  systemPrompt: string;
  conversation: Array<{ role: "user" | "assistant"; text: string }>;
} {
  let systemPrompt = "";
  const conversation: Array<{ role: "user" | "assistant"; text: string }> = [];

  for (const m of prompt) {
    if (m.role === "system") {
      systemPrompt += (systemPrompt ? "\n\n" : "") + m.content;
    } else if (m.role === "user") {
      const text = flattenText(m.content);
      if (text) conversation.push({ role: "user", text });
    } else if (m.role === "assistant") {
      const text = flattenText(m.content);
      if (text) conversation.push({ role: "assistant", text });
    }
  }

  return { systemPrompt, conversation };
}

function extractClientNameFromSystem(systemPrompt: string): string | undefined {
  const match = systemPrompt.match(/# The client's name\s+"([^"]+)" was collected/);
  return match?.[1];
}

function buildInterviewReply(
  systemPrompt: string,
  conversation: Array<{ role: "user" | "assistant"; text: string }>,
): string {
  const clientName = extractClientNameFromSystem(systemPrompt);
  const state = extractDiagnosticState(conversation);
  const lastUserMsg = [...conversation].reverse().find((m) => m.role === "user")?.text ?? "";

  // Check if user explicitly asked to wrap up or finish
  const userWantsToFinish =
    /that's all i have|thats all i have|skip the rest|generate report|finish interview/i.test(
      lastUserMsg,
    );

  // Build acknowledgment of what was just shared
  const ackParts: string[] = [];

  if (lastUserMsg.startsWith("[Uploaded file:")) {
    const newlineIdx = lastUserMsg.indexOf("\n");
    const headerLine = newlineIdx === -1 ? lastUserMsg : lastUserMsg.slice(0, newlineIdx);
    const body = newlineIdx === -1 ? "" : lastUserMsg.slice(newlineIdx + 1);
    const fileName = headerLine.replace(/^\[Uploaded file:\s*/, "").replace(/\]$/, "");

    const csvAnalysis = analyzeInvoiceExtractCsv(body);
    if (csvAnalysis) {
      ackParts.push(
        `Thank you for sharing **${fileName}** (${csvAnalysis.rowCount} invoice rows). Here is what I have extracted from the file:\n\n` +
          `- **PO-backed invoices (\`ap_04\`):** **${csvAnalysis.poBackedPct}%** (${csvAnalysis.poBackedCount} of ${csvAnalysis.rowCount} rows PO-backed; ${csvAnalysis.nonPoCount} non-PO)\n` +
          `- **Invoice exception rate (\`ap_08\`):** **${csvAnalysis.exceptionRatePct}%** (${csvAnalysis.exceptionCount} of ${csvAnalysis.rowCount} rows flagged — all ${csvAnalysis.crossTab.nonPo.exceptionCount} exceptions occur on non-PO invoices)\n` +
          `- **Paid on time (\`ap_11\`):** **${csvAnalysis.paidOnTimePct}%** (${csvAnalysis.paidOnTimeCount} of ${csvAnalysis.rowCount} rows paid on time)\n` +
          `- **Approval time (\`ap_09\` lower bound):** **${csvAnalysis.avgApprovalDays} days** average \`days_to_approval\` (${csvAnalysis.crossTab.poBacked.avgApprovalDays} days on PO-backed vs **${csvAnalysis.crossTab.nonPo.avgApprovalDays} days** on non-PO)\n\n` +
          (csvAnalysis.isSmallSample
            ? `*Note: Because this is a ${csvAnalysis.rowCount}-row sample extract, I have recorded these rates as indicative and will flag the sample size in the diagnostic report.*`
            : ""),
      );
    } else {
      const capturedFromFile: string[] = [];
      if (state.fields.ap_03?.source === "file-upload") {
        capturedFromFile.push(`monthly volume of **${state.fields.ap_03.value}**`);
      }
      if (state.fields.ap_04?.source === "file-upload") {
        capturedFromFile.push(`PO coverage of **${state.fields.ap_04.value}**`);
      }
      if (state.fields.ap_06?.source === "file-upload") {
        capturedFromFile.push(`SAP OCR setup and email PDF intake`);
      }
      if (state.fields.ap_15?.source === "file-upload") {
        capturedFromFile.push(`dual approval above 50k INR adding 3–4 days`);
      }

      if (capturedFromFile.length > 0) {
        ackParts.push(
          `Thank you for uploading **${fileName}**. From that note, I have recorded your ${capturedFromFile.join(", ")}.`,
        );
      } else {
        ackParts.push(`Thank you for uploading **${fileName}**. I have folded those notes into the diagnostic checklist.`);
      }
    }
  } else if (lastUserMsg.trim()) {
    ackParts.push(
      clientName
        ? `Got it — thank you for sharing that context for **${clientName}**.`
        : "Got it — thank you for sharing that.",
    );
  }

  // Count how many times each question has been asked so we don't loop forever on a PARTIAL field
  const askedCounts: Record<string, number> = {};
  for (const m of conversation) {
    if (m.role !== "assistant") continue;
    for (const fieldId of FIXED_INTERVIEW_FIELD_IDS) {
      const spec = AP_CHECKLIST_FIELDS.find((f) => f.field_id === fieldId);
      if (spec && m.text.includes(spec.question.slice(0, 35))) {
        askedCounts[fieldId] = (askedCounts[fieldId] ?? 0) + 1;
      }
    }
  }

  if (!userWantsToFinish) {
    for (const fieldId of FIXED_INTERVIEW_FIELD_IDS) {
      const fieldState = state.fields[fieldId];
      const spec = AP_CHECKLIST_FIELDS.find((f) => f.field_id === fieldId);
      if (!spec) continue;

      const timesAsked = askedCounts[fieldId] ?? 0;

      if (fieldState.status === "PARTIAL" && timesAsked < 2) {
        return (
          `${ackParts.join("\n\n")}\n\n` +
          `To help place **${spec.shortLabel.toLowerCase()}** accurately in the diagnostic, could you share a rough number or range? Even a ballpark estimate is completely fine:\n\n` +
          `${spec.question}`
        );
      }

      if (fieldState.status === "MISSING" && timesAsked < 1) {
        return `${ackParts.join("\n\n")}\n\n${spec.question}`;
      }
    }
  }

  return (
    `${ackParts.join("\n\n")}\n\n` +
    `I now have everything needed across your volume, PO coverage, exception handling, cycle time, payment metrics, and team structure for a first-pass diagnostic. Please click **"Generate Report"** in the top right to produce your benchmarked Accounts Payable Diagnostic Report.`
  );
}

function buildDiagnosticReportMarkdown(
  systemPrompt: string,
  conversation: Array<{ role: "user" | "assistant"; text: string }>,
): string {
  const clientName = extractClientNameFromSystem(systemPrompt) ?? "{not established}";
  const state = extractDiagnosticState(conversation);
  const m = state.metrics;
  const f = state.fields;
  const evals = evaluateAllBenchmarks(m);

  const hasUploadedExtract = Boolean(state.extractAnalysis);
  const basisLine = hasUploadedExtract
    ? `Structured diagnostic interview with the AP Manager, plus an uploaded invoice aging extract (${state.extractAnalysis?.rowCount} rows)`
    : "Structured diagnostic interview with the AP Manager";

  const poPct = m.ap_04;
  const nonPoPct = poPct !== undefined ? 100 - poPct : undefined;
  const excPct = m.ap_08;
  const cycleDays = m.ap_09;
  const dpoDays = m.ap_10;
  const otpPct = m.ap_11;
  const elecPct = m.ap_12;
  const termsCount = m.ap_13;
  const discPct = m.ap_14;

  const derivedEval = evals.find((e) => e.spec.field_id === "ap_derived");
  const queriesEval = evals.find((e) => e.spec.field_id === "ap_17");
  const invPerFte = derivedEval?.clientValue ?? undefined;
  const queriesPer1k = queriesEval?.clientValue ?? undefined;

  // 1. Executive Summary
  const execHeadline =
    poPct !== undefined && poPct < 80
      ? "**Low PO coverage is the root cause of AP's cost and its service problem, and the two are the same problem.**"
      : "**Process friction across invoice matching and approval routing is driving avoidable rework, extended cycle times, and missed early-payment value.**";

  const execPara1 =
    poPct !== undefined && nonPoPct !== undefined
      ? `Only **${poPct}%** of invoices arrive against a purchase order (against an India peer benchmark of 85% and a global benchmark of 95%). The remaining **${nonPoPct}%** cannot be matched automatically and route for manual review and approval, driving ${
          excPct !== undefined
            ? `an **${excPct}%** exception rate (India peer point: 8%, Global: 2%)`
            : "elevated manual exception handling"
        }, ${
          cycleDays !== undefined
            ? `a **${cycleDays}-day** receipt-to-posting cycle (India peer point: 4 days, Global: 2 days)`
            : "extended approval turnaround"
        }, and ${
          otpPct !== undefined
            ? `**${otpPct}%** of invoices paid on time against agreed terms (India peer point: 70%, Global: 95%)`
            : "delayed vendor payment execution"
        }.${
          queriesPer1k !== undefined
            ? ` Vendors then follow up on payment status at roughly **${queriesPer1k} queries per 1,000 invoices** (India peer point: 40, Global: 15), which the AP team absorbs alongside transaction processing.`
            : ""
        }`
      : `Based on the diagnostic inputs provided, invoice exception rate sits at **${
          excPct !== undefined ? `${excPct}%` : "{not established}"
        }** (India peer point: 8%, Global: 2%) with a receipt-to-posting cycle time of **${
          cycleDays !== undefined ? `${cycleDays} days` : "{not established}"
        }** (India peer point: 4 days, Global: 2 days) and on-time payment performance of **${
          otpPct !== undefined ? `${otpPct}%` : "{not established}"
        }** (India peer point: 70%, Global: 95%).`;

  const execPara2 = `Three commercial and operational consequences follow. First, the function processes **${
    invPerFte !== undefined ? `${invPerFte}k invoices per FTE per year` : "{not established} invoices per FTE per year"
  }** against an India peer point of 40k and a global point of 44k — a gap explained by non-PO rework and exception handling rather than team capability. Second, early-payment discount capture sits at **${
    discPct !== undefined ? `${discPct}%` : "{not established}"
  }** (India peer point: 45%, Global: 85%), representing a direct, quantifiable cost of approval delay. Third, ${
    termsCount !== undefined
      ? `**${termsCount} distinct payment terms** are in use across the vendor base (India peer point: 20, Global: 8)`
      : `payment terms proliferation across the vendor base (\`{not established}\` distinct terms)`
  }, which complicates payment scheduling and makes on-time performance harder to manage cleanly.`;

  const execPara3 =
    "None of the primary upstream fixes require a new ERP system. The largest single lever — enforcing PO discipline with a defined exception list and turning on ageing-based approval escalation — is a policy, governance, and workflow configuration change.";

  // 2. As-is Observations table rows
  const observations = [
    {
      id: "AP01",
      sub: "Invoice Processing",
      obs:
        poPct !== undefined && nonPoPct !== undefined
          ? `${nonPoPct}% of invoices are non-PO (${poPct}% PO-backed against an India peer point of 85%). These bypass three-way matching entirely and route for manual coding and approval.`
          : "PO-backed versus non-PO invoice split was `{not established}` during the interview; non-PO spend bypasses three-way matching and requires manual approval routing.",
      opp: "Introduce a formal no-PO-no-pay policy backed by procurement and finance, with an explicit exception list for categories that genuinely cannot carry a PO. Target 85% PO coverage within two quarters.",
      cons: "Impact **High** · Ease **Medium** · Process · **3-6 months**. Needs procurement sponsorship and requisitioner compliance, not an AP decision alone.",
    },
    {
      id: "AP02",
      sub: "Invoice Processing",
      obs:
        excPct !== undefined
          ? `Invoice exception rate of ${excPct}%, against an India peer point of 8% and a global point of 2%.${
              state.extractAnalysis
                ? ` In the ${state.extractAnalysis.rowCount}-row extract, ${state.extractAnalysis.crossTab.nonPo.exceptionPct}% of non-PO invoices hit an exception versus ${state.extractAnalysis.crossTab.poBacked.exceptionPct}% of PO-backed invoices.`
                : " Most exceptions trace to upstream non-PO volume and tight match tolerances rather than vendor billing errors."
            }`
          : "Invoice exception rate (`{not established}`) requires formal reason-code tracking; tolerance settings on freight and rounding variance manufacture avoidable manual blocks.",
      opp: "Expect baseline exceptions to fall as PO coverage improves under AP01. In parallel, review three-way match tolerances to eliminate manufactured blocks on minor freight or tax rounding variances, and enforce exception reason coding.",
      cons: "Impact **High** · Ease **High** · Process · **0-3 months**. Match tolerance calibration is an ERP configuration change and is an immediate quick win.",
    },
    {
      id: "AP03",
      sub: "Invoice Processing",
      obs:
        cycleDays !== undefined
          ? `Receipt-to-posting cycle time of ${cycleDays} days against an India peer point of 4 days and a global point of 2 days.${
              f.ap_15?.status === "ANSWERED"
                ? ` ${f.ap_15.value}.`
                : " Invoices wait in approver inboxes without automated escalation or substitute routing."
            }`
          : "Receipt-to-posting cycle time (`{not established}`) is extended by manual approval routing and lack of substitute approver delegation when sign-off roles travel.",
      opp: "Configure ageing-based escalation and substitute-approver rules in the workflow tool, and publish weekly approver-level ageing visibility.",
      cons: "Impact **Medium** · Ease **High** · Technology · **0-3 months**. Approver ageing visibility and substitute delegation typically recover 1–2 days before any system replacement.",
    },
    {
      id: "AP04",
      sub: "Payments",
      obs:
        otpPct !== undefined
          ? `${otpPct}% of invoices are paid on time against agreed terms (India peer point: 70%, Global: 95%)${
              dpoDays !== undefined
                ? `, while Days Payable Outstanding sits at ${dpoDays} days (India: 55 days, Global: 45 days)`
                : ""
            }. Delays are concentrated in upstream approval and exception resolution prior to payment release.`
          : "Paid-on-time percentage (`{not established}`) and DPO (`{not established}`) require joint monitoring so late payment is not misread as working capital discipline.",
      opp: "Fix the upstream receipt-to-posting cycle (AP01–AP03) first. Re-measure paid-on-time performance after upstream changes land before attempting vendor terms renegotiation.",
      cons: "Impact **High** · Ease **Medium** · Process · **3-6 months**. Sequencing is critical: renegotiating payment terms on a slow approval process fixes nothing.",
    },
    {
      id: "AP05",
      sub: "Payments",
      obs:
        termsCount !== undefined
          ? `${termsCount} distinct payment terms are active across the vendor base (against an India peer point of 20 and a global point of 8), creating scheduling complexity.`
          : "Number of distinct payment terms across the vendor master is `{not established}`; historic drift in vendor terms typically obscures true on-time performance.",
      opp: "Rationalise vendor payment terms to a standard set of 5 to 8 commercial bands, with category-level sign-off required for any non-standard term.",
      cons: "Impact **Medium** · Ease **Medium** · Process · **6-12 months**. Requires vendor segmentation and commercial alignment with procurement.",
    },
    {
      id: "AP06",
      sub: "Payments",
      obs:
        discPct !== undefined
          ? `Early-payment discount capture sits at ${discPct}% (against an India peer point of 45% and a global point of 85%). Discounts are missed because approval cycle time exceeds the discount window.`
          : `Early-payment discount capture rate is \`{not established}\`${
              f.ap_14?.status === "PARTIAL"
                ? " (noted qualitatively that discounts are missed due to approval delays)"
                : ""
            }, leaving direct savings unquantified.`,
      opp: "Quantify the annual cash value of forgone early-payment discounts and fast-track discount-eligible invoices through priority approval queues to fund the broader AP transformation.",
      cons: "Impact **Medium** · Ease **High** · Process · **0-3 months**. Sizing the annual discount leakage provides the self-funding business case for AP01–AP03.",
    },
    {
      id: "AP07",
      sub: "Query & Dispute",
      obs:
        queriesPer1k !== undefined
          ? `Roughly ${queriesPer1k} vendor queries per 1,000 invoices (${
              m.ap_17 ? `${m.ap_17.toLocaleString()} queries/month` : "normalised"
            } against India peer point of 40 and Global of 15), handled reactively by the AP processing team.`
          : "Monthly vendor query volume (`{not established}`) is handled reactively without root-cause categorisation or self-service status lookup.",
      opp: "Log query root causes and deploy vendor self-service status lookup only after upstream on-time payment (AP04) improves.",
      cons: "Impact **Medium** · Ease **Low** · Technology · **6-12 months**. Do not deploy a portal before fixing AP04, or it will merely automate status checks on late payments.",
    },
    {
      id: "AP08",
      sub: "Vendor Master",
      obs:
        f.ap_02?.status === "ANSWERED" || f.ap_21?.status === "ANSWERED" || f.ap_22?.status === "ANSWERED"
          ? `Vendor master maintenance (${f.ap_02?.value || "{not established}"}), approval check (${f.ap_21?.value || "{not established}"}), and bank-detail verification (${f.ap_22?.value || "{not established}"}) expose segregation-of-duties and payment diversion risk.`
          : "Vendor master creation/amendment access (`{not established}`), independent approval checks (`{not established}`), and bank-detail callback verification (`{not established}`) were not confirmed as segregated from invoice processing.",
      opp: "Segregate vendor master maintenance from invoice processing, enforce dual approval on all vendor amendments, and mandate an independent callback to an on-file phone number for every bank-detail change.",
      cons: "Impact **High** · Ease **High** · People · **0-3 months**. Urgent internal control gap rather than an efficiency item; close in Phase 1.",
    },
  ];

  const obsTableRows = observations
    .map((r) => `| ${r.id} | ${r.sub} | ${r.obs} | ${r.opp} | ${r.cons} |`)
    .join("\n");

  // 3. Maturity Assessment
  const maturityRows = [
    {
      sub: "Vendor Master",
      cur: f.ap_22?.status === "ANSWERED" && /callback|dual/i.test(f.ap_22.value) ? "Defined" : "Basic",
      target: "Defined",
      basis:
        f.ap_02?.status === "ANSWERED"
          ? `${f.ap_02.value}; requires strict segregation of duties and mandatory bank-change callback control.`
          : "Segregation of duties and independent bank-detail callback verification need formalisation (`{not established}`).",
    },
    {
      sub: "Invoice Processing",
      cur: poPct !== undefined && poPct >= 80 ? "Defined" : "Developing",
      target: "Advanced",
      basis:
        poPct !== undefined
          ? `OCR capability exists, but ${poPct}% PO coverage and ${excPct ?? "{not established}"}% exception rate prevent straight-through processing.`
          : "Automated capture is constrained by non-PO invoice volume and manual approval routing.",
    },
    {
      sub: "Payments",
      cur: otpPct !== undefined && otpPct >= 70 ? "Defined" : "Developing",
      target: "Defined",
      basis:
        otpPct !== undefined
          ? `${otpPct}% paid on time${elecPct !== undefined ? ` and ${elecPct}% electronic share` : ""}; upstream cycle time and terms spread suppress service levels.`
          : "Payment timeliness and discount capture are constrained by upstream cycle delays.",
    },
    {
      sub: "Reconciliation",
      cur: "Defined",
      target: "Defined",
      basis:
        f.ap_16?.status === "ANSWERED"
          ? f.ap_16.value
          : "GR-IR clearing cadence (`{not established}`) should be maintained on a monthly review and quarterly clearance discipline.",
    },
    {
      sub: "Query & Dispute",
      cur: queriesPer1k !== undefined && queriesPer1k <= 40 ? "Developing" : "Basic",
      target: "Developing",
      basis:
        queriesPer1k !== undefined
          ? `Reactive handling of ~${queriesPer1k} queries per 1,000 invoices by core processing staff with no self-service lookup.`
          : "Queries handled reactively without root-cause tracking or self-service status visibility.",
    },
    {
      sub: "Compliance",
      cur: "Developing",
      target: "Advanced",
      basis:
        f.ap_18?.status === "ANSWERED"
          ? f.ap_18.value
          : "MSME vendor identification and statutory late-payment interest exposure tracking (`{not established}`) require automated ERP alerting.",
    },
  ];

  const maturityTable = maturityRows
    .map((r) => `| ${r.sub} | ${r.cur} | ${r.target} | ${r.basis} |`)
    .join("\n");

  // 4. Benchmarking table in causal order
  const causalOrder = [
    "ap_derived",
    "ap_04",
    "ap_08",
    "ap_09",
    "ap_10",
    "ap_11",
    "ap_12",
    "ap_13",
    "ap_14",
    "ap_17",
  ];
  const benchmarkRows = causalOrder
    .map((fid) => {
      const ev = evals.find((e) => e.spec.field_id === fid)!;
      const clientCell = ev.clientValue !== null ? `${ev.clientValue}` : "{not established}";
      const readCell =
        ev.clientValue !== null
          ? `${ev.positionLabel}. ${ev.dependencyWarning ? `${ev.dependencyWarning} ` : ""}${ev.interpretation}`
          : `{not established} — ${ev.interpretation}`;
      return `| ${ev.spec.metric} | ${ev.spec.unit} | ${ev.spec.global_benchmark} | ${ev.spec.india_benchmark} | ${clientCell} | ${readCell} |`;
    })
    .join("\n");

  // Missing fields list for section 6
  const unestablishedList = AP_CHECKLIST_FIELDS.filter(
    (spec) => f[spec.field_id]?.status !== "ANSWERED",
  ).map((spec) => `${spec.shortLabel.toLowerCase()} (\`${spec.field_id}\`)`);

  const notEstablishedPara =
    unestablishedList.length > 0
      ? `**Not established during this interview:** ${unestablishedList.slice(0, 8).join(", ")}${
          unestablishedList.length > 8 ? `, and ${unestablishedList.length - 8} additional context fields` : ""
        }, as well as total annual addressable spend in INR/USD, exception split by reason code, and quantified MSME late-payment interest exposure. Confirming these figures before the next workshop will sharpen the financial business case.`
      : "**Not established during this interview:** total annual addressable spend under management, the granular split of exceptions by ERP reason code, and whether statutory MSME late-payment interest exposure has been quantified in cash terms. Each should be requested before the business-case sign-off session.";

  return `# Accounts Payable Diagnostic: Current State Assessment

**Client:** ${clientName}
**Process in scope:** Accounts Payable
**Period reviewed:** Twelve months to ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
**Basis:** ${basisLine}

---

## 1. Executive Summary

${execHeadline}

${execPara1}

${execPara2}

${execPara3}

---

## 2. As-is Observations

Each observation carries a paired improvement opportunity. Tags: **Impact** and **Ease** are High / Medium / Low, **Dimension** is Process, People or Technology, **Timeframe** is months to realise.

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|
${obsTableRows}

---

## 3. Maturity Assessment

Five bands: **Basic · Developing · Defined · Advanced · Leading**

| Sub-process | Current | Target (12 months) | Basis |
|---|---|---|---|
${maturityTable}

---

## 4. Benchmarking

Client position against global and India peer points. Units stated per row.

| Metric | Unit | Global | India | Client | Read |
|---|---|---|---|---|---|
${benchmarkRows}

---

## 5. Opportunities by Lever

**Standardisation**
- Introduce a formal no-PO-no-pay policy with an agreed category exception list (AP01)
- Rationalise active vendor payment terms to five to eight standard bands (AP05)

**Optimization**
- Calibrate three-way match tolerances to eliminate manufactured freight/rounding exceptions (AP02)
- Sequence on-time payment improvement behind upstream cycle-time reduction (AP04)
- Quantify annual early-payment discount leakage to build the self-funding business case (AP06)

**Technology**
- Enable ageing-based workflow escalation, substitute approvers, and weekly approver ageing visibility (AP03)
- Deploy vendor self-service payment status lookup after upstream on-time payment stabilises (AP07)

**People and controls**
- Separate vendor master maintenance from invoice processing and mandate callback verification on bank-detail changes (AP08)

---

## 6. Suggested Next Steps

1. **Weeks 0-4.** Close the vendor master segregation-of-duties and bank-callback control gap (AP08). Review and recalibrate three-way match tolerances (AP02). Quantify annual early-payment discount leakage in cash terms (AP06) to size the programme business case.
2. **Weeks 4-12.** Agree the no-PO-no-pay policy with procurement and publish the approved exception list (AP01). Turn on ageing-based approval escalation, substitute approver rules, and weekly approver ageing reporting (AP03).
3. **Quarter 2 onward.** Re-measure on-time payment percentage (\`ap_11\`), exception rate (\`ap_08\`), and per-FTE throughput (\`ap_derived\`). Only after upstream flow stabilises, execute vendor payment terms rationalisation (AP05) and vendor self-service status portal deployment (AP07).

${notEstablishedPara}
`;
}

export function buildCfoReviewMarkdown(reportText: string): string {
  const lines = reportText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const execClaim =
    lines.find((l) => l.startsWith("**Low PO coverage") || l.startsWith("**Process friction")) ??
    lines.find((l) => l.includes("PO coverage") || l.includes("exception rate")) ??
    "Low PO coverage is the root cause of AP's cost and its service problem.";

  const discountLine =
    lines.find((l) => /discount capture/i.test(l)) ??
    "Early-payment discount capture sits below peer benchmarks, representing a direct cost of delay.";

  const cycleLine =
    lines.find((l) => /receipt-to-posting|cycle time/i.test(l)) ??
    "Receipt-to-posting cycle time exceeds the India and global peer benchmarks.";

  const notEstLine =
    lines.find((l) => l.startsWith("**Not established during this interview:**")) ??
    "Not established during this interview: annual spend under management and exception split by reason code.";

  return `### CFO Stress-Test Critique

1. **Unproven causal attribution on exception rate**
   > *"${execClaim.replace(/\*\*/g, "")}"*
   You assert that non-PO volume is the primary driver of the exception rate and downstream cycle delay, but the report does not provide a population-wide breakdown of exceptions by ERP reason code (price variance vs. quantity variance vs. missing GRN vs. non-PO coding failure). Before I mandate a business-wide procurement policy change, show me the exact share of monthly exceptions caused by non-PO routing versus three-way match tolerance blocks on PO-backed invoices.

2. **Discount leakage claimed as the business case with zero cash value attached**
   > *"${discountLine.replace(/\*\*/g, "").slice(0, 180)}"*
   You tell me early-payment discount leakage funds the rest of the programme (AP06), yet the report contains **no rupee or dollar figure** for total discount-eligible spend or annual cash discounts forgone. A percentage capture rate without the denominator of eligible invoice value is not a business case I can sign off.

3. **Cycle time delay not decomposed by stage**
   > *"${cycleLine.replace(/\*\*/g, "").slice(0, 180)}"*
   The report quotes a single end-to-end receipt-to-posting figure, but does not separate **indexing/capture wait time** from **business approver inbox dwell time**. If email PDFs are still being keyed by hand, turning on workflow escalation in approvers' inboxes (AP03) will not fix the pre-posting intake lag.

4. **Missing statutory and financial exposure figures admitted at the end**
   > *"${notEstLine.replace(/\*\*/g, "").slice(0, 200)}"*
   The report's closing note concedes that annual addressable spend, exception reason-code splits, and MSME late-payment interest exposure were never established — yet the observations table grades impact as **High** across multiple levers without sizing the financial exposure at stake.

**The single biggest gap:** The report claims early-payment discount capture (AP06) will fund the transformation programme, but fails to establish annual discount-eligible spend or the actual rupee/dollar value of discounts lost.`;
}

export const builtInApDiagnosticModel: LanguageModelV4 = {
  specificationVersion: "v4",
  provider: "ey-ap-built-in",
  modelId: "ey-ap-diagnostic-engine-v2",
  supportedUrls: {},

  async doGenerate(options: LanguageModelV4CallOptions) {
    const { systemPrompt, conversation } = extractMessages(options.prompt);
    const isReport = systemPrompt.includes("# How you build the report");
    const isReview = systemPrompt.includes("You are the Reviewer");

    const text = isReview
      ? buildCfoReviewMarkdown(conversation[conversation.length - 1]?.text ?? "")
      : isReport
        ? buildDiagnosticReportMarkdown(systemPrompt, conversation)
        : buildInterviewReply(systemPrompt, conversation);

    return {
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 0, text: 0, reasoning: 0 },
      },
      warnings: [],
    };
  },

  async doStream(options: LanguageModelV4CallOptions) {
    const { systemPrompt, conversation } = extractMessages(options.prompt);
    const isReport = systemPrompt.includes("# How you build the report");
    const isReview = systemPrompt.includes("You are the Reviewer");

    const fullText = isReview
      ? buildCfoReviewMarkdown(conversation[conversation.length - 1]?.text ?? "")
      : isReport
        ? buildDiagnosticReportMarkdown(systemPrompt, conversation)
        : buildInterviewReply(systemPrompt, conversation);

    const textId = "ey-ap-engine-text-0";

    const stream = new ReadableStream<LanguageModelV4StreamPart>({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        controller.enqueue({ type: "text-start", id: textId });

        // Stream smoothly in natural chunks
        const chunkSize = isReport ? 120 : 48;
        for (let i = 0; i < fullText.length; i += chunkSize) {
          const delta = fullText.slice(i, i + chunkSize);
          controller.enqueue({ type: "text-delta", id: textId, delta });
          await new Promise((r) => setTimeout(r, 8));
        }

        controller.enqueue({ type: "text-end", id: textId });
        controller.enqueue({
          type: "finish",
          finishReason: { unified: "stop", raw: "stop" },
          usage: {
            inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 0, text: 0, reasoning: 0 },
          },
        });
        controller.close();
      },
    });

    return { stream };
  },
};
