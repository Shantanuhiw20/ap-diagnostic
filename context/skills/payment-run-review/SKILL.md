---
name: payment-run-review
description: Reviews payment execution, payment terms, on-time performance, discount capture and statutory payment compliance as part of an AP diagnostic. Use when DPO, paid-on-time percentage, payment terms spread, cheque versus electronic payment, early payment discounts, payment approval thresholds or MSME interest exposure comes up.
---

# Payment Execution Review

Payments is where AP's service failure becomes visible to the vendor base, and where the wrong fix is most tempting. A low paid-on-time figure looks like a cash decision and is almost always an upstream approval bottleneck. This skill's discipline is sequencing: establish where the delay actually sits before recommending anything about terms.

## Read these first

- `sample-data/ap-data-collection-template-v2.csv` for the checklist fields and the exact question wording. This is the v2, reviewed checklist (22 fields); `ap_14` was reworded here to invite an honest estimate rather than a precise-sounding guess, and the original 20-field file is no longer authoritative.
- `sample-data/ap-benchmark-data.csv` for the only benchmark points that may be quoted
- `personas/ap-persona.md` for tone and the never-invent rules

## Fields this skill owns

| field_id | What it establishes |
|---|---|
| ap_10 | Average Days Payable Outstanding |
| ap_11 | Percentage of invoices paid on time against agreed terms |
| ap_12 | Percentage of payments made electronically versus by cheque |
| ap_13 | Number of distinct payment terms in use across the vendor base |
| ap_14 | Percentage of eligible early-payment discounts actually captured |
| ap_15 | Number of payment approval steps, and whether thresholds change the approver |
| ap_18 | How MSME vendors and late-payment interest exposure are tracked |
| ap_19 | AP FTE count |

Does not own: PO coverage (`/procurement-review`), exception rate and receipt-to-posting cycle time (`/invoice-processing-review`), vendor queries (`/vendor-master-review`).

## Benchmarks it may quote

Read straight from `ap-benchmark-data.csv`:

- **Days Payable Outstanding**, unit days. Global 45, India 55, commonly observed 40 to 70. The file's read: read against agreed terms, never on its own. High DPO with low paid-on-time means late payment, not working capital management.
- **Paid on time against terms**, unit percentage. Global 95, India 70, commonly observed 20 to 50. The file's read: the headline AP service metric. Below 60 percent is almost always an approval bottleneck rather than a deliberate cash decision.
- **Payments made electronically**, unit percentage. Global 98, India 75, commonly observed 5 to 40. The file's read: cheque volume carries cost, delay and fraud exposure. Usually the cheapest win available and rarely contested.
- **Distinct payment terms in use**, unit count. Global 8, India 20, commonly observed 30 to 80. The file's read: a long tail of terms makes on-time payment unmeasurable, so fix this before trying to improve the paid-on-time number.
- **Early payment discount capture**, unit percentage. Global 85, India 45, commonly observed under 50. The file's read: directly quantifiable missed savings. Low capture alongside slow cycle time is the clearest cost-of-delay argument available.

There is no benchmark on file for payment approval step count, payment run frequency or MSME interest exposure. Say so plainly rather than quoting a figure.

## Interpretation rules, non-negotiable

These come straight from the benchmark file's reads and the reference report's sequencing logic:

1. **DPO is never read alone.** It requires `ap_11`. High DPO with low paid-on-time is late payment, not working capital management, and saying otherwise flatters a failure. If `ap_11` is missing, say "this needs paid-on-time to interpret" rather than giving a read.
2. **Terms count is fixed before on-time performance.** A long tail of distinct terms makes the paid-on-time figure difficult to manage and, until rationalised, difficult even to measure honestly.
3. **Sequence the on-time fix behind the cycle-time fix.** If receipt-to-posting is slow, terms renegotiation on a broken process fixes nothing. Re-measure on-time performance after the upstream work lands, and say so in the recommendation.
4. **Discount leakage is the business case, not just a finding.** Low capture alongside slow cycle time quantifies the cost of delay, and is the number that funds the rest of the programme. Ask for the annual value where it can be estimated from client figures.

## What to probe

Ask two or three of these at a time:

1. How often is a payment run executed, and is it a fixed calendar or run on demand?
2. Where does the delay actually sit, before payment release or at it? An ageing extract answers this better than an opinion does.
3. Why are there so many payment terms? Is there a commercial rationale behind the spread, or is it historic drift? Who negotiates terms today?
4. Are discounts being declined deliberately for cash reasons, or lost to cycle time? These need completely different recommendations.
5. What is still paid by cheque, for which vendors, and what actually blocks conversion?
6. How many approval steps does a payment pass, and do thresholds change who approves? Which role is the usual bottleneck?
7. Is there a substitute approver rule, and does it get used when someone is unavailable?
8. How are MSME vendors identified, is the interest exposure on late payment ever calculated, and where is it tracked?
9. Is there a payments-on-hold population, and how old is it?

## Failure patterns to recognise

- **DPO quoted as working capital management.** Near the India point achieved through lateness rather than negotiated terms is a service failure wearing a treasury costume.
- **Terms renegotiation proposed first.** It is the visible lever and the wrong one while the upstream cycle is broken.
- **Cash timing blamed for late payment.** The ageing profile usually shows the delay concentrated before payment release, not at it. Check before accepting the explanation.
- **Discounts written off as a policy choice.** Usually they are lost to cycle time and nobody has ever quantified the annual value.
- **Cheque volume defended by habit.** It is typically the cheapest win in the whole diagnostic and rarely contested once sized.
- **MSME exposure tracked in a spreadsheet, or not at all.** A statutory exposure with real financial consequences, managed manually.
- **A long approval chain with no substitute rule.** Two unavailable approvers can hold a material share of the monthly run.

## Readiness rules

- `ap_11` is the must-have. Without paid-on-time, nothing else in this section can be interpreted, including DPO.
- Do not produce a payment finding using `ap_10` alone.
- `ap_13` and `ap_14` can be approximate. A range is enough to establish the pattern.

## Output shape

Emit findings as rows in the same grid used by `sample-data/ap-reference-diagnostic-report.md`, so they merge with the other sub-process reviews into one report:

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|

- IDs continue the AP01, AP02 sequence already in use in the report being built.
- Sub-process is Payments, or Compliance for MSME findings.
- Tags go in the considerations cell: Impact High/Medium/Low, Ease High/Medium/Low, Dimension Process/People/Technology, Timeframe 0-3, 3-6, 6-12 or 12+ months.
- Every observation carries a paired opportunity. A finding with no recommendation is a complaint.
- Ease is about the organisation, not the size of the edit. Quantifying discount leakage is Ease High. Terms rationalisation, which needs vendor-by-vendor review and renegotiation, is not.
- Where sequencing matters, say it in the considerations cell, as the reference report does.

## Rules this skill must enforce

- Never invent a DPO, an on-time percentage, a discount value, a terms count, a vendor name or an incident. If it was not said, mark it `{not established}`.
- Never report a number without its unit.
- Never call a number good or bad without naming the global and India points.
- Never give a DPO read without paid-on-time alongside it.
- Ask two or three questions at a time, never the whole list.
- Plain language, minimal jargon. A client's finance team reads this, not a data analyst.
