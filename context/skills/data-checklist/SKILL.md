---
name: data-checklist
description: Audits an AP client conversation against the 22-field data collection checklist, separates answered from missing fields, and drafts the next two or three questions to ask. Use whenever a client conversation or transcript is partial and you need to know what is still missing, or whether there is enough data to write a diagnostic report yet.
---

# AP Data Checklist Audit

Take a conversation (pasted in, or a file path), audit it field by field against the checklist, and draft the next questions. The point of this skill is to stop a report being written on half the facts, and to stop a client being handed a wall of twenty-plus questions at once.

## Read this first

`sample-data/ap-data-collection-template-v2.csv` is authoritative. It has 22 fields with columns `field_id`, `category`, `question`, `why_it_matters`, `data_type`. Read it at the start of every run. The table below is a working map for prioritisation, not a substitute for the file. If the two ever disagree, the file wins and you should say so.

This is the v2 checklist, reviewed and corrected from the original 20-field version. `ap_02` was split (the control half moved to `ap_21`), three fields were reworded to invite an honest estimate instead of a false-precision guess (`ap_08`, `ap_09`, `ap_14`), and `ap_22` was added to close a control gap the original never asked about. The original `sample-data/ap-data-collection-template.csv` still exists for reference but is no longer the one this skill audits against.

## The 22 fields

| field_id | Category | Establishes | data_type |
|---|---|---|---|
| ap_01 | Vendor Master | Active vendor count | number |
| ap_02 | Vendor Master | Who creates or amends a vendor | text |
| ap_03 | Invoice Processing | Monthly invoice volume | number |
| ap_04 | Invoice Processing | PO-backed versus non-PO split | percentage |
| ap_05 | Invoice Processing | Receipt channel mix | text |
| ap_06 | Invoice Processing | OCR or automated capture in use | yes/no |
| ap_07 | Invoice Processing | Three-way match and tolerance setting | text |
| ap_08 | Invoice Processing | Exception rate, estimate acceptable | percentage |
| ap_09 | Invoice Processing | Receipt to posting in days, estimate acceptable | number (days) |
| ap_10 | Payments | Days Payable Outstanding | number (days) |
| ap_11 | Payments | Paid on time against terms | percentage |
| ap_12 | Payments | Electronic versus cheque | percentage |
| ap_13 | Payments | Distinct payment terms in use | number |
| ap_14 | Payments | Early payment discount capture, estimate acceptable | percentage |
| ap_15 | Payments | Approval steps and thresholds | text |
| ap_16 | Reconciliation | GR-IR backlog size and review cadence | text |
| ap_17 | Query & Dispute | Vendor queries per month | number |
| ap_18 | Compliance | MSME tracking and interest exposure | text |
| ap_19 | Team | AP FTE count | number |
| ap_20 | Pain point | Biggest bottleneck, in the client's own words | text |
| ap_21 | Vendor Master | What check or approval sits in front of vendor creation or amendment | text |
| ap_22 | Vendor Master | Verification on a vendor bank-detail change | text |

## Three states, not two

- **ANSWERED.** The transcript states it explicitly. Quote the line that answers it.
- **PARTIAL.** The subject came up but the answer is not usable. A qualitative answer on a numeric field is PARTIAL, not ANSWERED. "On-time payment is decent" and "we miss a lot of early payment discounts" are PARTIAL. Quote the line and say what is still needed, normally a number or a range.
- **MISSING.** Not covered at all.

Never mark ANSWERED on an inference. If a number has to be deduced rather than read, mark it PARTIAL and say what the deduction assumed.

## Priority tiers for the next question

Do not work through the file in `field_id` order. Priority follows the causal chain in `sample-data/ap-reference-diagnostic-report.md`, where low PO coverage produces exceptions, exceptions produce cycle time, and cycle time produces late payment.

- **Tier 1, blocking.** `ap_04` PO coverage, `ap_08` exception rate. Without both, the root cause cannot be located at all. Ask for these before anything else.
- **Tier 2, headline and control.** `ap_11` paid on time, the headline service metric. `ap_02` and `ap_21` together, who can create or amend a vendor and what check sits in front of it, the main control exposure. `ap_22` bank-detail change verification, the highest-consequence control question in the whole checklist. `ap_03` volume and `ap_19` FTE count, needed together for any productivity comparison. `ap_09` cycle time.
- **Tier 3, sizing and business case.** `ap_10` DPO, `ap_13` terms count, `ap_14` discount capture, `ap_12` electronic share.
- **Tier 4, context and configuration.** `ap_01`, `ap_05`, `ap_06`, `ap_07`, `ap_15`, `ap_16`, `ap_17`, `ap_18`.
- **`ap_20` is never skipped.** Ask it whatever else is outstanding. It carries the tacit knowledge a form cannot, and it usually tells you which sub-process to dig into next.
- **`ap_02` and `ap_21` are asked as a pair.** They used to be one field. Do not consider the control question closed on `ap_02` alone. A client who names who can create a vendor but never says whether any check sits in front of it has answered half the question, and that half is the less important one.

Within a tier, prefer numeric fields over text fields, since numbers unlock benchmark reads.

## Readiness gate

State one of these at the end of every run:

- **Not enough data to diagnose.** `ap_04` or `ap_08` is missing or PARTIAL. Say which, and that the root cause cannot be located without it, even where volume and FTE numbers are already in hand.
- **Enough to diagnose, thin in places.** Tier 1 complete, gaps at Tier 3 or 4. Name the gaps that would weaken specific findings.
- **Ready for a report.** Tier 1 and Tier 2 complete. Note anything still outstanding so it can go in the report's closing "not established" paragraph.

## Output shape

1. **Status table.** One row per field: `field_id`, category, state, and either the quoted evidence or the reason it is not answered. Group by category, in the file's own category order.
2. **Summary line.** "X of 22 answered, Y partial, Z missing." Count all three states, and make them add to 22.
3. **Readiness verdict.** One of the three above, with the blocking field named.
4. **Next two or three questions.** Taken verbatim from the `question` column for the highest-priority outstanding fields. Say which `field_id` each one is closing.
5. **Where to dig next, one line.** If the outstanding fields cluster in one category, name the sub-process skill that owns it: `/procurement-review` for `ap_04`, `/grn-review` for `ap_07` and `ap_16`, `/invoice-processing-review` for `ap_03`, `ap_05`, `ap_06`, `ap_08`, `ap_09`, `/payment-run-review` for `ap_10` to `ap_15`, `ap_18`, `ap_19`, `/vendor-master-review` for `ap_01`, `ap_02`, `ap_17`, `ap_21`, `ap_22`.

## Rules this skill must enforce

- Never mark a field ANSWERED on a guess. If it is unclear, mark it PARTIAL or MISSING and say why.
- Never invent a value, a client name or an incident to fill a gap.
- Only two or three questions at a time, never the whole list. A real client conversation cannot absorb a wall of questions, and the ones asked late get worse answers.
- Use the `question` column wording rather than paraphrasing. It is already tested phrasing.
- Do not treat an opinion as a metric. A client saying a number is fine is not the number.
- An estimate is not the same as ANSWERED versus PARTIAL question it was before. `ap_08`, `ap_09` and `ap_14` now invite an estimate in their own wording, so a client giving a range on these counts as ANSWERED, not PARTIAL. Reserve PARTIAL for these three only when the client gives no figure at all, just a qualitative impression.
- Count against 22 fields, not 20 and not 16.
- Plain language, minimal jargon.

## Chaining

- Answers pulled out of an uploaded file by `/file-reader` come in here next, audited the same way as a live conversation.
- Once Tier 1 and Tier 2 numeric fields are ANSWERED, pass them to `/benchmark-interpreter` for the reads.
- Once the readiness verdict reaches "ready for a report", pass the answers and the benchmark reads to `/template-filler`.
