---
name: vendor-master-review
description: Reviews vendor master data, segregation of duties, bank detail change controls and vendor query handling as part of an AP diagnostic. Use when vendor counts, duplicate vendors, who can create or amend a vendor record, bank account changes, vendor onboarding, vendor deactivation, or vendor query and dispute volume comes up.
---

# Vendor Master and Controls Review

Everything else in AP is an efficiency conversation. This one is a control conversation, and it is graded differently. Vendor creation without segregation of duties is the single most common fraud exposure in AP, and a finding here is urgent regardless of how the Impact and Ease tags happen to fall.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the checklist fields and the exact question wording. This is the v2 checklist: `ap_02` was split, the control half is now its own field `ap_21`, and `ap_22` was added specifically to cover bank-detail change verification, a question this skill was already probing for before the field existed. The original 20-field file is no longer authoritative.
- `sample-data/ap-benchmark-data.csv` for the only benchmark points that may be quoted
- `personas/ap-persona.md` for tone and the never-invent rules

## Fields this skill owns

| field_id | What it establishes |
|---|---|
| ap_01 | Active vendor count in the ERP |
| ap_02 | Who can create or amend a vendor master record |
| ap_21 | What check or approval sits in front of a vendor master creation or amendment, if any |
| ap_22 | Verification on a vendor bank-detail change, for example a callback to a number already on file |
| ap_17 | Vendor queries handled per month |

`ap_02` and `ap_21` were one field before the checklist was reviewed. Treat them as a pair. A client naming who has access without saying whether any check sits in front of it has answered the less important half.

Reads but does not own: `ap_03` monthly invoice volume, owned by `/invoice-processing-review`. This skill needs it to normalise query volume, so ask for it if missing and attribute it correctly.

Does not own: payment execution and terms (`/payment-run-review`), invoice capture and exceptions (`/invoice-processing-review`).

## Benchmarks it may quote

Read straight from `ap-benchmark-data.csv`:

- **Vendor queries per 1000 invoices**, unit count. Global 15, India 40, commonly observed 50 to 120. The file's read: normalise the monthly query count against invoice volume before comparing. High query load usually tracks late payment, not vendor behaviour.

There is **no benchmark on file** for vendor count, active-to-total ratio, duplicate rate, onboarding cycle time or bank-detail change volume. Do not invent one. Say plainly that the benchmark file does not cover it, and reason from the client's own numbers instead.

## Interpretation rules, non-negotiable

1. **Normalise queries before comparing.** A raw monthly query count means nothing. Convert to queries per 1000 invoices using `ap_03`, and show the arithmetic. Without `ap_03`, state that the figure cannot be compared yet.
2. **Query volume is usually a symptom, not a cause.** High load typically tracks late payment, not difficult vendors. Check paid-on-time from `/payment-run-review` before recommending anything about query handling.
3. **Do not recommend a self-service portal before on-time payment is fixed.** Building it first automates a symptom, and the volume would have fallen on its own once payment timing improved.
4. **A control gap is not an efficiency finding.** Grade it as urgent and say so, even where the tags would place it alongside a routine improvement.

## What to probe

Ask two or three of these at a time:

1. Who can create a vendor, who can amend one, and who approves? Is it the same team that processes invoices?
2. What happens when a vendor asks to change their bank details? Is there dual approval, and is there a callback to a number already on file rather than one supplied in the request?
3. How many of the vendor records are genuinely active? What does the tail of one-time vendors look like, and when was each last used?
4. How are duplicates detected: on name, on tax registration, on bank account? Bank account is the one that matters most and is checked least.
5. Is there a deactivation process, and who triggers it? Records that are never closed accumulate exposure.
6. During onboarding, who collects tax and bank details, and through what channel? Email attachments are the common exposure.
7. What are the vendor queries actually about? Payment status, short payment, missing remittance, or something else?
8. Who handles queries, and is it the same staff who process invoices? Is the root cause of repeat queries ever tracked?
9. Is there any self-service route for a vendor to check payment status without calling?

## Failure patterns to recognise

- **No segregation of duties.** Vendor creation and amendment sitting with the same team that processes invoices, with no independent review. Treat as urgent. This is a control gap rather than an efficiency point.
- **Bank details changed on an email.** Accepted without a callback to a previously held number. The highest-consequence weakness in the whole function.
- **Duplicates checked on name only.** Two records with different spellings and the same bank account will pass a name check.
- **A long tail never deactivated.** One-time vendors left open for years, each one a live payment route.
- **Queries handled reactively by the processing team.** Invisible in headcount planning, and it competes directly with invoice throughput.
- **Root cause of repeat queries never tracked.** The same three questions asked every month with nobody counting.
- **A portal proposed as the fix.** Technology aimed at a symptom of late payment.

## Readiness rules

- `ap_02` and `ap_21` together are the must-have. Who can create and amend a vendor, and what check sits in front of it, is the pair this entire review turns on. Do not close the section on `ap_02` alone.
- `ap_22` is a close second. Bank-detail change verification is the highest-consequence weakness this skill looks for, and a report that covers creation and amendment but is silent on bank-detail change has missed the sharpest finding available.
- `ap_17` needs `ap_03` before it can be compared to the benchmark.
- `ap_01` can be approximate, but ask separately for the active share if the total looks large relative to invoice volume.

## Output shape

Emit findings as rows in the same grid used by `sample-data/ap-reference-diagnostic-report.md`, so they merge with the other sub-process reviews into one report:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs continue the AP01, AP02 sequence already in use in the report being built.
- Sub-process is Vendor Master, or Query and Dispute for query findings.
- Tags go in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months.
- Every observation carries a paired opportunity. A finding with no recommendation is a complaint.
- For a control finding, add that it is a control gap rather than an efficiency point and should be treated as urgent. Separating vendor master maintenance from transaction processing, and adding dual approval on bank-detail changes, is Ease High and belongs in the first phase of any next-steps plan.

## Rules this skill must enforce

- Never invent a vendor count, a query volume, a duplicate rate, a vendor name or a fraud incident. If it was not said, mark it `{not established}`.
- Never quote a benchmark for vendor count, duplicates or onboarding. There is none on file. State that instead of estimating.
- Never report a normalised query figure without showing the arithmetic and the invoice volume used.
- Never suggest a vendor portal before checking paid-on-time performance.
- Ask two or three questions at a time, never the whole list. Control questions in particular land badly as an interrogation.
- If an answer on segregation of duties turns defensive, acknowledge the sensitivity and reframe around the process rather than pressing on who specifically holds the access.
- Plain language, minimal jargon. A client's finance team reads this, not a data analyst.
