---
name: procurement-review
description: Reviews procurement and purchase order discipline as part of an AP diagnostic. Use when non-PO spend, PO coverage, retrospective POs, requisition-to-PO flow, catalogue coverage, or no-PO-no-pay policy readiness comes up in a client conversation.
---

# Procurement and PO Discipline Review

PO coverage is the upstream control that makes everything downstream in AP automatable. Low coverage is the most common root cause in an AP diagnostic, and it is a procurement and policy problem, not an AP one. This skill probes that root cause properly instead of accepting a single coverage percentage and moving on.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the checklist fields and the exact question wording. This is the v2, reviewed checklist (22 fields); the original 20-field file is no longer authoritative.
- `sample-data/ap-benchmark-data.csv` for the only benchmark points that may be quoted
- `personas/ap-persona.md` for tone and the never-invent rules

## Fields this skill owns

| field_id | What it establishes |
|---|---|
| ap_04 | PO-backed versus non-PO invoice split, as a percentage |
| ap_03 | Monthly invoice volume, needed as the denominator to convert the percentage into a real non-PO count |

Does not own: invoice capture, exception handling and approval routing (`/invoice-processing-review`), match tolerance and goods receipt (`/grn-review`).

## Benchmark it may quote

Only this row, read straight from `ap-benchmark-data.csv`:

- **PO-backed invoices**, unit percentage. Global 95, India 85, commonly observed 70 to 90.
- The file's read: below 80 percent means most spend bypasses the control that makes matching possible, and everything downstream gets manual.

There is no benchmark on file for requisition cycle time, catalogue coverage or retrospective PO rate. Say so plainly rather than quoting a figure.

## What to probe beyond the headline percentage

A coverage number alone does not tell you whether the problem is policy, behaviour or category structure. Ask two or three of these at a time:

1. Which spend categories account for most of the non-PO volume? Services and facilities usually dominate. If it is direct materials, the problem is different and more serious.
2. Is a PO ever raised after the invoice arrives, to clear a block? A high retrospective rate means stated coverage overstates real control.
3. Who can commit spend without raising a requisition, and is that by policy or by workaround?
4. Is there a catalogue or preferred supplier list, and what share of spend flows through it?
5. Does a no-PO-no-pay policy already exist on paper, and if so what happens today when it is breached?
6. Who owns the policy, procurement or finance, and does AP have any authority to reject a non-PO invoice?

## Failure patterns to recognise

- **Stated coverage beats real coverage.** Retrospective POs raised to release a blocked invoice count as PO-backed in the system but delivered none of the control.
- **A policy with no teeth.** No-PO-no-pay exists but AP has no mandate to reject, so every breach becomes an exception instead.
- **No exception list.** Categories that genuinely cannot carry a PO, such as utilities, statutory payments and some professional fees, have no defined route, so they are handled as one-off manual cases every month.
- **AP owns the symptom, procurement owns the cause.** Coverage cannot be fixed inside AP, so a recommendation aimed only at AP will not move the number.
- **Low coverage blamed on vendors.** The vendor rarely decides whether a PO exists. The requisitioner does.

## Readiness rule

Do not write a procurement finding without `ap_04`. Without the coverage percentage there is no size to the problem, only an anecdote. If the client cannot give a number, ask for a range and label it as an estimate.

## Output shape

Emit findings as rows in the same grid used by `sample-data/ap-reference-diagnostic-report.md`, so they merge with the other sub-process reviews into one report:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs continue the AP01, AP02 sequence already in use in the report being built.
- Tags go in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months.
- Every observation carries a paired opportunity. A finding with no recommendation is a complaint.
- Ease is about the organisation, not the size of the edit. A policy change needing procurement sponsorship is not Ease High.

## Rules this skill must enforce

- Never invent a coverage figure, a category split, a vendor name or an incident. If it was not said, mark it `{not established}`.
- Never call a coverage number good or bad without naming the global and India points and the unit.
- Ask two or three questions at a time, never the whole list. A real client conversation cannot absorb a wall of questions.
- Do not recommend technology for a coverage problem. Capture tools do not create POs.
- Plain language, minimal jargon. A client's finance team reads this, not a data analyst.
