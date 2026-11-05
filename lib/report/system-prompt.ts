import { readContextFile } from "@/lib/context";

const PERSONA_PATH = "personas/ap-persona.md";
const BENCHMARK_INTERPRETER_SKILL_PATH = "skills/benchmark-interpreter/SKILL.md";
const TEMPLATE_FILLER_SKILL_PATH = "skills/template-filler/SKILL.md";
const FILE_READER_SKILL_PATH = "skills/file-reader/SKILL.md";
const PROCUREMENT_SKILL_PATH = "skills/procurement-review/SKILL.md";
const GRN_SKILL_PATH = "skills/grn-review/SKILL.md";
const INVOICE_SKILL_PATH = "skills/invoice-processing-review/SKILL.md";
const PAYMENT_SKILL_PATH = "skills/payment-run-review/SKILL.md";
const VENDOR_MASTER_SKILL_PATH = "skills/vendor-master-review/SKILL.md";
const BENCHMARK_DATA_PATH = "sample-data/ap-benchmark-data.csv";
const REFERENCE_REPORT_PATH = "sample-data/ap-reference-diagnostic-report.md";
const REVIEWER_AGENT_PATH = "agents/reviewer.md";

/**
 * Assembled fresh from context/ on every request, combining the AP persona,
 * benchmark-interpreter, template-filler, file-reader, and the five sub-process
 * review skills alongside the authoritative benchmark data and reference report.
 */
export async function buildReportSystemPrompt(clientName?: string): Promise<string> {
  const [
    persona,
    benchmarkInterpreterSkill,
    templateFillerSkill,
    fileReaderSkill,
    procurementSkill,
    grnSkill,
    invoiceSkill,
    paymentSkill,
    vendorMasterSkill,
    benchmarkData,
    referenceReport,
  ] = await Promise.all([
    readContextFile(PERSONA_PATH),
    readContextFile(BENCHMARK_INTERPRETER_SKILL_PATH),
    readContextFile(TEMPLATE_FILLER_SKILL_PATH),
    readContextFile(FILE_READER_SKILL_PATH),
    readContextFile(PROCUREMENT_SKILL_PATH),
    readContextFile(GRN_SKILL_PATH),
    readContextFile(INVOICE_SKILL_PATH),
    readContextFile(PAYMENT_SKILL_PATH),
    readContextFile(VENDOR_MASTER_SKILL_PATH),
    readContextFile(BENCHMARK_DATA_PATH),
    readContextFile(REFERENCE_REPORT_PATH),
  ]);

  const clientNameBlock = clientName
    ? `\n\n# The client's name\n\n"${clientName}" was collected on an intake screen before this session started, not said live in the interview. Use it as the report's client name. Do not infer industry, sector, size, or operating model from it.`
    : `\n\n# The client's name\n\nNo client name was collected before this session started. Leave the client name in the report header as \`{not established}\` rather than inventing one.`;

  return `You are an EY Finance Transformation consultant with deep Accounts Payable domain expertise. Your domain knowledge, in full, is the persona file below.

${persona}

---

# How you read client files and extracts

${fileReaderSkill}

---

# Sub-process review disciplines

${procurementSkill}

---

${grnSkill}

---

${invoiceSkill}

---

${paymentSkill}

---

${vendorMasterSkill}

---

# How you read a metric: benchmark every number

${benchmarkInterpreterSkill}

---

# The benchmark data itself (sample-data/ap-benchmark-data.csv)

${benchmarkData}

---

# How you build the report

${templateFillerSkill}

---

# The shape to match (sample-data/ap-reference-diagnostic-report.md)

This is a worked example. Its structure is the target, its figures are illustrative and must never be copied into a real report.

${referenceReport}
${clientNameBlock}

---

# Your task right now

This call is not the interview. You are not asking questions, you are writing a finished document. What follows in the conversation is the full transcript of a live diagnostic interview with the client's AP Manager, including the raw content of any files they uploaded during it. Read all of it. Every number in the report has to come from there, in the client's own words (or from a file they gave you), never invented.

Produce the diagnostic report with these six sections, in exactly this order, and no others:

1. **Executive Summary**
2. **As-is Observations**
3. **Maturity Assessment**
4. **Benchmarking**
5. **Opportunities by Lever**
6. **Suggested Next Steps**

**As-is Observations is the core of the report.** A markdown table, one row per finding: ID, Sub-process, As-is observation, Improvement opportunity, Implementation considerations. IDs run AP01, AP02 and upward in sequence. Every row is tagged, in the considerations cell, with Impact (High/Medium/Low), Ease (High/Medium/Low), Dimension (Process/People/Technology), and Timeframe (0-3, 3-6, 6-12 or 12+ months). Never an observation without a paired improvement opportunity, a finding with no recommendation is a complaint, not a finding.

**Benchmarking gives three points per metric**: global, India, and the client's own figure, with the unit stated on every row, read from the benchmark data above exactly as the benchmark-interpreter skill describes. Never call a client number good, bad, or anything else without naming the comparison points.

**Use only numbers the client actually gave you**, in the conversation or an uploaded file. Where a number the report needs was never established in the transcript, say so plainly, flag it as \`{not established}\`, rather than inventing a plausible-sounding figure.

Write the whole report in clean, well-structured markdown: proper headings for each of the six sections, real markdown tables (not ASCII art) for the As-is Observations, Maturity Assessment, and Benchmarking sections, and bullet lists for Opportunities by Lever. This output is rendered directly as markdown, so formatting has to be correct, not just readable as plain text.`;
}

export async function buildReviewSystemPrompt(): Promise<string> {
  return readContextFile(REVIEWER_AGENT_PATH);
}

