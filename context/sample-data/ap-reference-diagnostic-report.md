# Accounts Payable Diagnostic: Current State Assessment

**Client:** Harlow Industrial Components (illustrative)
**Process in scope:** Accounts Payable
**Period reviewed:** Twelve months to March 2026
**Basis:** Structured interview with the AP Manager, plus an invoice aging extract

> This is a worked example with invented figures. It exists to show the shape a
> finished report takes: how findings are written, tagged and evidenced. Every
> number a real report contains must come from the client.

---

## 1. Executive summary

**Low PO coverage is the root cause of AP's cost and its service problem, and the two are the same problem.**

Only 62% of invoices arrive against a purchase order. The remaining 38% cannot be matched automatically, so they route to a person, which drives an 18% exception rate, a six-day receipt-to-posting cycle and, at the end of that chain, 41% of invoices paid on time. Vendors then call to ask where their money is, at roughly 75 queries per 1,000 invoices, and the team absorbs that too.

Three consequences follow. The function processes about 16,000 invoices per FTE per year against an India peer point of 40,000. Early-payment discount capture sits at 38%, a direct and measurable cost of the delay. And 47 distinct payment terms are in use, which makes the on-time number difficult to manage and, until rationalised, difficult even to measure honestly.

None of the above requires a new system. The largest single lever, PO coverage, is a policy and compliance change.

---

## 2. As-is observations

Each observation carries a paired improvement opportunity. Tags: **Impact** and **Ease** are High / Medium / Low, **Dimension** is Process, People or Technology, **Timeframe** is months to realise.

| ID | Sub-process | As-is observation | Improvement opportunity | Implementation considerations |
|---|---|---|---|---|
| AP01 | Invoice Processing | 38% of invoices are non-PO. These bypass three-way matching entirely and are routed for manual approval. | Introduce a no-PO-no-pay policy with a defined exception list. Target 85% PO coverage within two quarters. | Impact **High** · Ease **Medium** · Process · **3-6 months**. Needs procurement sponsorship, not an AP decision alone. |
| AP02 | Invoice Processing | Exception rate of 18%, against an India peer point of 8%. Most exceptions trace to AP01 rather than to vendor error. | Expect exceptions to fall with PO coverage. Separately, review the match tolerance, which is currently tight enough to manufacture exceptions on freight variance. | Impact **High** · Ease **High** · Process · **0-3 months**. Tolerance change is a configuration, and is a quick win. |
| AP03 | Invoice Processing | Receipt-to-posting cycle time of six days against a global point of two. Invoices sit in an approver's inbox with no escalation. | Add ageing-based escalation in the workflow tool and publish approver-level ageing weekly. | Impact **Medium** · Ease **High** · Technology · **0-3 months**. Visibility alone typically recovers a day or two. |
| AP04 | Payments | 41% of invoices are paid on time. The team attributes this to cash timing, but the ageing extract shows delays concentrated before payment release, not at it. | Fix the upstream cycle first. Re-measure on-time performance after AP01 to AP03 land, before considering any terms renegotiation. | Impact **High** · Ease **Medium** · Process · **3-6 months**. Sequencing matters, since terms renegotiation on a broken process fixes nothing. |
| AP05 | Payments | 47 distinct payment terms across the vendor base, many differing by a few days with no commercial rationale. | Rationalise to a standard set of five to eight terms, with exceptions approved by category. | Impact **Medium** · Ease **Medium** · Process · **6-12 months**. Requires vendor-by-vendor review and some renegotiation. |
| AP06 | Payments | Early-payment discount capture of 38%. Discounts are lost to cycle time rather than declined deliberately. | Quantify the annual value forgone and use it as the business case for AP01 to AP03. | Impact **Medium** · Ease **High** · Process · **0-3 months**. This is the number that funds the rest of the programme. |
| AP07 | Query & Dispute | Roughly 75 vendor queries per 1,000 invoices, handled reactively by the same staff who process invoices. | Deploy vendor self-service for status lookup. Expect volume to fall as on-time payment improves. | Impact **Medium** · Ease **Low** · Technology · **6-12 months**. Do not build this before AP04, or it will be automating a symptom. |
| AP08 | Vendor Master | Vendor creation and amendment sit with the same team that processes invoices, with no independent review. | Separate vendor master maintenance from transaction processing, and add dual approval on bank-detail changes. | Impact **High** · Ease **High** · People · **0-3 months**. Control gap rather than an efficiency point, and should be treated as urgent. |

---

## 3. Maturity assessment

Five bands: **Basic · Developing · Defined · Advanced · Leading**

| Sub-process | Current | Target (12 months) | Basis |
|---|---|---|---|
| Vendor Master | Basic | Defined | No segregation of duties, no independent review of bank-detail changes |
| Invoice Processing | Developing | Advanced | OCR in place, but low PO coverage prevents it being used properly |
| Payments | Developing | Defined | Electronic penetration reasonable, on-time performance is not |
| Reconciliation | Defined | Defined | GR-IR reviewed monthly and cleared within the quarter. Already adequate |
| Query & Dispute | Basic | Developing | Reactive, no self-service, no root-cause tracking |
| Compliance | Developing | Advanced | MSME vendors flagged but interest exposure tracked manually in a spreadsheet |

---

## 4. Benchmarking

Client position against global and India peer points. Units stated per row.

| Metric | Unit | Global | India | Client | Read |
|---|---|---|---|---|---|
| Invoices per AP FTE | '000 p.a. | 44 | 40 | 16 | Well below both. Explained by exception load, not by team capability |
| PO-backed invoices | % | 95 | 85 | 62 | The root finding. Everything downstream follows from this |
| Exception rate | % | 2 | 8 | 18 | Over twice the India point, consistent with PO coverage |
| Receipt to posting | days | 2 | 4 | 6 | Approval routing rather than processing capacity |
| Days Payable Outstanding | days | 45 | 55 | 58 | Near the India point, but achieved through lateness rather than terms |
| Paid on time | % | 95 | 70 | 41 | The service failure, and the number the vendor base actually feels |
| Electronic payments | % | 98 | 75 | 55 | Behind, though not the binding constraint here |
| Distinct payment terms | count | 8 | 20 | 47 | Makes the on-time figure hard to manage or even measure |
| Discount capture | % | 85 | 45 | 38 | Quantifiable cost of the cycle time above |

---

## 5. Opportunities by lever

**Standardisation**
- No-PO-no-pay policy with a defined exception list (AP01)
- Payment terms rationalised to five to eight standard sets (AP05)

**Optimization**
- Match tolerance review to stop manufacturing exceptions (AP02)
- Sequence the on-time fix behind the cycle-time fix (AP04)
- Quantify discount leakage as the programme business case (AP06)

**Technology**
- Ageing-based escalation and approver-level visibility in the workflow tool (AP03)
- Vendor self-service portal for payment status (AP07)

**People and controls**
- Separate vendor master maintenance from transaction processing (AP08)

---

## 6. Suggested next steps

1. **Weeks 0-4.** Close the vendor master control gap (AP08). Review match tolerance (AP02). Quantify discount leakage (AP06) to size the case.
2. **Weeks 4-12.** Agree the no-PO-no-pay policy with procurement and publish the exception list (AP01). Turn on ageing escalation (AP03).
3. **Quarter 2 onward.** Re-measure on-time payment and exception rate. Only then take on payment terms rationalisation (AP05) and vendor self-service (AP07).

**Not established during this interview:** annual spend under management, the split of exceptions by reason code, and whether the MSME interest exposure has ever been quantified. Each would sharpen the business case and should be requested before the next session.
