---
name: template-filler
description: Turns AP checklist answers and benchmark reads into a full diagnostic report in the fixed six-section shape, with tagged findings, a maturity assessment, a benchmarking table, opportunities grouped by lever and sequenced next steps. Use whenever collected AP diagnostic data needs writing up as a client-ready report.
---

# Fill the AP Diagnostic Report Template

Take structured notes, checklist answers and benchmark reads, and produce the report. The shape does not change, only the content inside it. Match `sample-data/ap-reference-diagnostic-report.md`, which is the worked example of this exact output.

## Read this first

`sample-data/ap-reference-diagnostic-report.md` is the shape reference. Read it before writing, and compare against it section by section afterwards. Its figures are illustrative and must never be carried into a real report.

## Lead with the causal chain, not a list

The opening is the whole report in miniature. Most AP problems chain, and the chain in the reference report runs: low PO coverage produces exceptions, exceptions produce cycle time, cycle time produces late payment, late payment produces vendor queries, and the team absorbs all of it. Discount leakage sits alongside as the directly quantifiable cost of that delay.

Find the chain in the data supplied and open with it as a single claim. A report that opens with a list of nine findings has not done the analytical work. If the data genuinely does not chain, say what the independent problems are and why they are independent.

Also state plainly where a fix does not need a new system. The largest lever is usually a policy and compliance change, and saying so early is what stops the conversation drifting to software.

## The six sections, in this order

**1. Executive summary.** Three to five lines. Open with the causal chain as a bolded claim. Then the consequences that follow from it, with the numbers and their peer points. Close on what the biggest lever actually is.

**2. As-is observations.** A markdown table, one row per finding:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs run AP01, AP02 and upward, in sequence.
- Sub-process is one of Vendor Master, Invoice Processing, Payments, Reconciliation, Query & Dispute, Compliance.
- Every row carries four tags in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months. The reference report separates them with a middle dot and bolds the values.
- The considerations cell also carries the one thing a reader needs in order to act: who has to sponsor it, what it depends on, or why the sequencing matters.
- Order the rows by sub-process, so the grid reads as a walk through the process rather than a ranked list.

**3. Maturity assessment.** A table with one row per sub-process, giving current band, twelve-month target, and the basis in one line. Five bands: Basic, Developing, Defined, Advanced, Leading. Cover all six sub-processes, including any that are already adequate, because saying one is fine is evidence the assessment is real and not a sales document.

Working definitions, consistent with how the reference report justifies its bands: **Basic** means no defined process or no control. **Developing** means the process exists but is inconsistently applied, or a tool is in place but blocked from working. **Defined** means documented, consistently applied, and evidenced. **Advanced** means measured against targets with exceptions analysed by cause. **Leading** means continuously improved and externally benchmarked. A target is not automatically Leading. Defined is the right twelve-month target for most sub-processes starting at Basic.

**4. Benchmarking.** A markdown table: metric, unit, global, India, client, and a one-line read. Units stated per row. Take the reads from `/benchmark-interpreter` rather than writing fresh ones, and order the rows in causal order so the table argues the same case as the summary.

**5. Opportunities by lever.** Grouped under Standardisation, Optimization, Technology, and People and controls. Reference the finding IDs rather than restating the findings. A lever with nothing under it is left out rather than padded.

**6. Suggested next steps.** Sequenced in phases, in the reference report's style of Weeks 0-4, Weeks 4-12, then Quarter 2 onward. Close with a short paragraph headed as what was not established during the interview, naming the gaps and why each would sharpen the case.

## Sequencing rules for the next steps

Getting the order wrong is the most common way a technically correct report gives bad advice:

- **Phase one** takes control gaps, configuration changes and quantification work. A segregation of duties gap is urgent regardless of its tags. A match tolerance change is a configuration and lands quickly. Quantifying discount leakage costs nothing and funds everything else.
- **Phase two** takes the policy changes that need another function's sponsorship, PO coverage above all, and the visibility changes that need no new system.
- **Quarter two onward** takes anything that should only be attempted after re-measurement: payment terms rationalisation, vendor self-service, and any renegotiation.
- **Never put terms renegotiation or a vendor portal in phase one.** Renegotiating terms on a broken process fixes nothing, and a portal built before on-time payment improves is automating a symptom. Say so in the considerations cell where it applies.
- Re-measure between phases and say which metrics get re-measured.

## Grading the tags honestly

**Ease is about the organisation, not the size of the edit.** A tolerance change is one configuration field and is Ease High. A no-PO-no-pay policy is one sentence of text and is not, because it needs procurement sponsorship and an agreed exception list. Ask who has to agree, not how much has to be typed.

**Impact is about the causal chain.** A finding upstream of others carries their consequences. Coverage is High because everything follows from it. Electronic payment share can be a genuine saving and still be Medium if it is not the binding constraint.

**A control gap is graded separately.** Flag it as a control finding rather than an efficiency point, and place it in phase one whatever its Impact and Ease happen to be.

## Rules this skill must enforce

- Never invent a number, a quote, a client name, a system name or an incident that was not in the notes supplied. Where the report needs something absent, put it in `{curly braces}` so it reads as an open item rather than a fact.
- Never an observation without a paired improvement opportunity. A finding with no recommendation is a complaint.
- Never a client number without its unit and its peer points.
- Keep the six headings and their order exactly. Do not add, rename or merge sections.
- Do not carry any figure from the reference report into a real one. Its numbers are illustrative.
- If the underlying data did not clear the readiness gate in `/data-checklist`, say so at the top of the report rather than writing around the gaps.
- Attribute the basis in the header block: who was interviewed, what period, what extracts were used.
- Tone: plain and confident, the way a senior consultant writes for a CFO. No marketing register, no hedging every sentence.

## Chaining

Findings arrive as grid rows from the five sub-process review skills, `/procurement-review`, `/grn-review`, `/invoice-processing-review`, `/payment-run-review` and `/vendor-master-review`, which all emit this same row shape. Renumber them into one AP01 upward sequence, order them by sub-process, and reconcile any duplicate finding rather than listing it twice. Benchmark reads arrive from `/benchmark-interpreter`, and the answered field set and readiness verdict from `/data-checklist`.
