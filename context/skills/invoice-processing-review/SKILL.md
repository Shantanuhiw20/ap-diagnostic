---
name: invoice-processing-review
description: Reviews invoice intake, data capture, exception handling and approval routing as part of an AP diagnostic. Use when invoice volume, receipt channels, OCR or automated capture, exception rate, receipt-to-posting cycle time, invoices per FTE, duplicate detection or approver bottlenecks come up.
---

# Invoice Processing Review

This is the engine room of AP, and the place where a capacity problem and a routing problem look identical from the outside. Cycle time and exception rate are both usually inherited from upstream, so this skill's job is to work out how much of the load is genuinely generated here and how much is arriving from procurement or goods receipt.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the checklist fields and the exact question wording. This is the v2, reviewed checklist (22 fields); `ap_08` and `ap_09` were reworded here to invite an honest estimate rather than a precise-sounding guess, and the original 20-field file is no longer authoritative.
- `sample-data/ap-benchmark-data.csv` for the only benchmark points that may be quoted
- `personas/ap-persona.md` for tone and the never-invent rules

## Fields this skill owns

| field_id | What it establishes |
|---|---|
| ap_03 | Monthly invoice volume, the scale of the operation |
| ap_05 | Channel mix: post, email, EDI, vendor portal or a mix |
| ap_06 | Whether OCR or automated capture is in use |
| ap_08 | Exception rate, the share of invoices needing manual resolution |
| ap_09 | Average days from invoice receipt to posting |

Reads but does not own: `ap_19` AP FTE count, owned by `/payment-run-review` only as a headcount fact. This skill needs it to compute invoices per FTE, so ask for it if missing and attribute it correctly.

Does not own: PO coverage (`/procurement-review`), match tolerance and GR-IR (`/grn-review`), payment terms and on-time performance (`/payment-run-review`).

## Benchmarks it may quote

Read straight from `ap-benchmark-data.csv`:

- **Invoice exception rate**, unit percentage. Global 2, India 8, commonly observed 10 to 20. The file's read: the strongest single predictor of AP effort. Above 15 percent the team is running a rework function, not a payment function.
- **Invoice receipt to posting**, unit days. Global 2, India 4, commonly observed 3 to 8. The file's read: raw process speed, independent of payment terms. Anything above 5 days usually points at approval routing, not capacity.
- **Invoices processed per AP FTE**, unit thousands per annum. Global 44, India 40, commonly observed 12 to 25. The file's read: compare only after normalising for non-PO mix. A low figure with high non-PO share is a process problem, not a people problem.

There is no benchmark on file for OCR hit rate, duplicate invoice rate, channel mix or rework frequency. Say so plainly rather than quoting a figure.

## What to probe

Ask two or three of these at a time:

1. What is the channel split by volume, and what share still arrives as paper or as an email PDF someone keys by hand?
2. If OCR is in place, what is its hit rate, and what happens when it fails? Is every captured invoice validated by a person regardless?
3. Where do invoices actually wait: capture, matching, approval, or posting? Ask the client to point to the step, not to give a total.
4. Are exceptions coded by reason, and is the split by reason code known? Without it, exceptions cannot be attacked.
5. How does approval route: by threshold, by cost centre, by delegation of authority? What decides the number of steps?
6. What happens when an approver is on leave or unavailable? Is there a substitute rule, and is it used?
7. Does anything escalate on ageing, and does anyone see ageing broken down by approver?
8. How often does an invoice go round a second time, and what usually causes that?
9. How are duplicate invoices detected, and has a duplicate payment ever been found after the fact?

## Failure patterns to recognise

- **Cycle time read as a capacity problem.** Above 5 days the time is usually spent sitting in an approver's inbox with no escalation, not in processing. Headcount does not fix a queue nobody is watching.
- **Exception rate inherited, not generated.** Most exceptions trace back to low PO coverage or a tight match tolerance. Attribute before recommending.
- **OCR bought and stranded.** Capture automation cannot be used properly when PO coverage is low, because matching is what makes captured data useful.
- **No reason codes.** Without an exception split by cause, every improvement is a guess.
- **Per-FTE productivity compared raw.** A low figure against the India point of 40,000 per year means nothing until non-PO mix is normalised out. Comparing raw makes it look like a team capability problem, which it usually is not.
- **Visibility mistaken for a system need.** Publishing approver-level ageing weekly typically recovers a day or two on its own, before any tooling change.

## Readiness rules

- `ap_08` and `ap_09` are the must-haves. Without the exception rate and the cycle time there is no shape to the processing problem.
- Invoices per FTE needs both `ap_03` and `ap_19`. Do not compute or quote it with only one.
- Do not compare invoices per FTE to the benchmark without `ap_04` PO coverage from `/procurement-review`. The benchmark file requires normalising for non-PO mix first.

## Output shape

Emit findings as rows in the same grid used by `sample-data/ap-reference-diagnostic-report.md`, so they merge with the other sub-process reviews into one report:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs continue the AP01, AP02 sequence already in use in the report being built.
- Sub-process is Invoice Processing.
- Tags go in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months.
- Every observation carries a paired opportunity. A finding with no recommendation is a complaint.
- Ease is about the organisation, not the size of the edit. Turning on ageing escalation is Ease High. Changing who approves what is not.

## Rules this skill must enforce

- Never invent a volume, an exception rate, a cycle time, a system name or an OCR hit rate. If it was not said, mark it `{not established}`.
- Never call a number good or bad without naming the global and India points and the unit.
- Always attribute the exception rate before recommending against it. Check PO coverage and match tolerance first, and say which is driving it.
- Ask two or three questions at a time, never the whole list.
- Plain language, minimal jargon. A client's finance team reads this, not a data analyst.
