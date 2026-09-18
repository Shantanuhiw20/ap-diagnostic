---
name: grn-review
description: Reviews goods receipt note handling, three-way match configuration and GR-IR clearing as part of an AP diagnostic. Use when match tolerance, quantity or price variances, goods receipt timeliness, blocked invoices, service receipt confirmation, or the GR-IR account backlog comes up.
---

# Goods Receipt and Three-Way Match Review

The goods receipt is the second leg of the three-way match, and it is where a PO-backed invoice still goes manual. Two things break here: a tolerance setting tight enough to manufacture exceptions on ordinary variance, and a GR-IR account nobody owns. This skill separates a real matching problem from a configuration choice.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the checklist fields and the exact question wording. This is the v2, reviewed checklist (22 fields); the original 20-field file is no longer authoritative.
- `sample-data/ap-benchmark-data.csv` for the only benchmark points that may be quoted
- `personas/ap-persona.md` for tone and the never-invent rules

## Fields this skill owns

| field_id | What it establishes |
|---|---|
| ap_07 | Whether a three-way match runs, and the tolerance set before an invoice needs manual review |
| ap_16 | GR-IR clearance backlog size and how often it is reviewed |

Reads but does not own: `ap_08` exception rate, owned by `/invoice-processing-review`. Tolerance is one of the two main causes of that rate, so quote it as context and attribute the field correctly.

Does not own: PO coverage (`/procurement-review`), approval routing and cycle time (`/invoice-processing-review`).

## Benchmarks it may quote

There is **no benchmark on file** for goods receipt timeliness, match tolerance settings, GR-IR ageing or blocked invoice volume. Do not invent one. Say plainly that the benchmark file does not cover it, and reason from the client's own numbers instead.

The nearest on-file proxy, to be used only as supporting context:

- **Invoice exception rate**, unit percentage. Global 2, India 8, commonly observed 10 to 20.
- The file's read: the strongest single predictor of AP effort. Above 15 percent the team is running a rework function, not a payment function.

## What to probe

Ask two or three of these at a time:

1. Who raises the goods receipt, and how soon after physical delivery? A receipt entered days late means the invoice arrives first and blocks.
2. Is the receipt captured in the system at the point of delivery, or on paper first and keyed later?
3. What tolerance is set, and is it absolute or percentage? Is it different for price versus quantity?
4. Who set that tolerance, and when was it last reviewed? Often nobody in the current team knows.
5. How are freight, rounding and partial deliveries treated? These are the classic sources of manufactured variance.
6. For service POs with no physical receipt, how is receipt confirmed, and by whom?
7. Is it three-way match everywhere, or two-way for some categories? What decides which?
8. When an invoice blocks on a match failure, who clears it and how long does it typically sit?
9. How large is the GR-IR balance, how old are the oldest items, and who owns clearing it?
10. Are aged GR-IR items ever written back at period end, and is the root cause looked at when that happens?

## Failure patterns to recognise

- **Tolerance manufactures exceptions.** A tolerance tight enough to trip on freight or rounding variance generates rework that looks like vendor error. This is a configuration change and usually the fastest win available in AP.
- **Receipt entered after the invoice.** The match cannot succeed because one leg does not exist yet. The block is a timing problem, not a data problem.
- **Service receipts have no discipline.** No physical goods means no natural trigger, so confirmation depends on chasing a requisitioner.
- **GR-IR treated as an accounting cleanup.** It is a process signal. A growing balance means matches are failing upstream, and clearing it monthly without asking why fixes nothing.
- **Split ownership, so no ownership.** Clearing sits between AP, procurement and the warehouse, and each assumes another owns it.
- **Write-back hides the cause.** Aged items written off at year end remove the evidence before anyone diagnoses it.

## Readiness rule

`ap_07` is the must-have. Without knowing whether a three-way match runs and at what tolerance, an exception rate cannot be interpreted at all. `ap_16` can be an approximate answer, a rough balance and a review cadence is enough to spot the pattern.

## Output shape

Emit findings as rows in the same grid used by `sample-data/ap-reference-diagnostic-report.md`, so they merge with the other sub-process reviews into one report:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs continue the AP01, AP02 sequence already in use in the report being built.
- Sub-process is Invoice Processing for match and tolerance findings, Reconciliation for GR-IR findings.
- Tags go in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months.
- Every observation carries a paired opportunity. A finding with no recommendation is a complaint.
- A tolerance change is genuinely Ease High, since it is a configuration. Changing who raises a goods receipt is not, since it needs another function to change behaviour.

## Rules this skill must enforce

- Never invent a tolerance figure, a GR-IR balance, an ageing profile or a system name. If it was not said, mark it `{not established}`.
- Never quote a benchmark for GR-IR or tolerance. There is none on file. State that instead of estimating.
- Do not attribute the exception rate to tolerance without checking PO coverage first. Low coverage is the more common cause, and the two produce the same symptom.
- Ask two or three questions at a time, never the whole list.
- Plain language, minimal jargon. A client's finance team reads this, not a data analyst.
