---
name: file-reader
description: Reads client-supplied files (an email, a spreadsheet or CSV extract, a screenshot) and pulls out the answers to the AP data collection checklist, calculating derived metrics and showing the arithmetic. Use whenever a client hands over a file mid-conversation and its contents need turning into checklist answers.
---

# Read a Client File into Checklist Answers

Take one or more client files, work out which checklist fields they answer, and show the working for anything calculated. A client will drop in an email or an extract without saying what is in it, so the job is to find what is genuinely there and be equally clear about what is not.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the 22 fields and their `data_type`. This is the v2 checklist: `ap_02` now covers vendor access only, `ap_21` is the paired control question, and `ap_22` is a new field on vendor bank-detail change verification. The original 20-field file still exists but is not what this skill reads against.
- `sample-data/ap-benchmark-data.csv` only if a calculated value needs placing in context, and prefer handing that to `/benchmark-interpreter`

## What each kind of file typically answers

**A narrative email from an AP manager** answers volume, coverage, channel mix, capture setup and the approval story, because those are things a person describes. It rarely gives a clean rate. Expect `ap_03`, `ap_04`, `ap_05`, `ap_06`, `ap_15`, and often `ap_20` in the form of a complaint. It will occasionally answer `ap_21` or `ap_22` if the manager volunteers something about vendor controls, but do not expect it, a control question usually needs to be asked directly.

**An invoice or aging extract** answers the rate questions, because rates can be counted off rows. Expect `ap_04`, `ap_08`, `ap_11` and an approval-time figure. It will not tell you FTE count, DPO, terms count or anything about controls, because those are not in the rows.

**A screenshot** is read the same way as whichever of the two it resembles. Transcribe the visible figures, quote them, and never infer a value from a cropped or partially visible field.

## Calculation recipes

For an extract with columns of the shape `invoice_id, vendor, amount_inr, po_backed, days_to_approval, exception_flag, paid_on_time`:

- **PO-backed share (`ap_04`)** = count where `po_backed` is yes, divided by total rows. State both counts.
- **Exception rate (`ap_08`)** = count where `exception_flag` is yes, divided by total rows.
- **Paid on time (`ap_11`)** = count where `paid_on_time` is yes, divided by total rows.
- **Average approval time** = mean of `days_to_approval`. Report it as approval time, not as `ap_09`. See the warning below.
- **Vendor concentration** = each vendor's share of total `amount_inr`. Useful context, though no checklist field collects it and no benchmark covers it, so label it as supplementary.

Cross-tabulate where the rows allow it, because that is where the real finding sits. Exception rate split by `po_backed`, or average `days_to_approval` split by `po_backed`, evidences the causal chain directly instead of asserting it. Say how many rows sat in each group.

## Two warnings that decide whether the output is honest

**Approval time is not cycle time.** `days_to_approval` measures one step. `ap_09` is receipt to posting, the whole span. Approval time is a component of it and a lower bound, never a substitute. Report it under its own name, and leave `ap_09` MISSING unless the file genuinely covers receipt through to posting.

**A small extract is not a monthly rate.** A ten-row sample produces a percentage that looks authoritative and is not. Always state the row count next to any calculated rate, call it indicative of the sample rather than the population, and say it needs confirming against the full period before it goes in a report. A rate computed from ten rows and presented as the monthly figure is the most likely way this skill produces a wrong finding.

## Qualitative statements are not metrics

An email saying discounts are missed does not answer `ap_14`. It establishes the pattern and leaves the number outstanding. Mark that field PARTIAL, quote the sentence, and say a percentage is still needed. The same applies to any numeric field described in words: a stated impression is evidence of a problem, not a measurement of it.

## Output shape

1. **Sources.** Each file named, with what kind of file it is and how much is in it, for example a row count for an extract.
2. **Field-by-field table.** `field_id`, state (ANSWERED, PARTIAL or MISSING), the value, the source file, and the exact quote or the arithmetic. Only list MISSING fields in a short closing list rather than a full row each, so the answered detail stays readable.
3. **Working, shown in full**, for every calculated figure: the numerator, the denominator, the row count, and the result.
4. **Cross-tabulations** where the rows supported one, with group sizes.
5. **What these files cannot tell you.** Name the fields that are genuinely absent, so the gap is explicit rather than an omission.

## Rules this skill must enforce

- Never invent a number that is not derivable from the files supplied.
- Show the arithmetic for every calculated field, so a consultant can check the row count and the working independently.
- Attribute every answer to a file, and to a line or a row range.
- Never merge two files into one figure without saying so. If the email says 40 percent non-PO and the extract computes 50 percent across ten rows, report both, note the sample size, and do not average them.
- Never promote a qualitative statement to a metric.
- Never equate approval time with receipt-to-posting cycle time.
- Where a file contains a vendor name, keep it only if it is needed as evidence, and never carry it into a finding that does not require it.
- Plain language, minimal jargon.

## Chaining

Hand the extracted answers straight to `/data-checklist`, which audits them exactly as it would a live conversation and drafts the next questions. Pass calculated metrics to `/benchmark-interpreter` for the reads, carrying the sample-size caveat with them so it does not get lost between skills.
