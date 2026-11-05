"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { EyHeader } from "@/components/EyHeader";
import { ReportPanel } from "@/components/ReportPanel";
import {
  AP_SUBPROCESS_STAGES,
  HARLOW_REFERENCE_CASE,
  evaluateAllBenchmarks,
  type NumericMetricsMap,
} from "@/lib/ap-diagnostic-data";

const HARLOW_REFERENCE_REPORT_MD = `# Accounts Payable Diagnostic: Current State Assessment

**Client:** Harlow Industrial Components (illustrative)
**Process in scope:** Accounts Payable
**Period reviewed:** Twelve months to March 2026
**Basis:** Structured interview with the AP Manager, plus an invoice aging extract

> This is a worked example with illustrative figures showing how findings are written, tagged, benchmarked, and sequenced.

---

## 1. Executive Summary

**Low PO coverage is the root cause of AP's cost and its service problem, and the two are the same problem.**

Only 62% of invoices arrive against a purchase order. The remaining 38% cannot be matched automatically, so they route to a person, which drives an 18% exception rate, a six-day receipt-to-posting cycle and, at the end of that chain, 41% of invoices paid on time. Vendors then call to ask where their money is, at roughly 75 queries per 1,000 invoices, and the team absorbs that too.

Three consequences follow. The function processes about 16,000 invoices per FTE per year against an India peer point of 40,000. Early-payment discount capture sits at 38%, a direct and measurable cost of the delay. And 47 distinct payment terms are in use, which makes the on-time number difficult to manage and, until rationalised, difficult even to measure honestly.

None of the above requires a new system. The largest single lever, PO coverage, is a policy and compliance change.

---

## 2. As-is Observations

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

## 3. Maturity Assessment

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

## 5. Opportunities by Lever

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

## 6. Suggested Next Steps

1. **Weeks 0-4.** Close the vendor master control gap (AP08). Review match tolerance (AP02). Quantify discount leakage (AP06) to size the case.
2. **Weeks 4-12.** Agree the no-PO-no-pay policy with procurement and publish the exception list (AP01). Turn on ageing escalation (AP03).
3. **Quarter 2 onward.** Re-measure on-time payment and exception rate. Only then take on payment terms rationalisation (AP05) and vendor self-service (AP07).

**Not established during this interview:** annual spend under management, the split of exceptions by reason code, and whether the MSME interest exposure has ever been quantified. Each would sharpen the business case and should be requested before the next session.`;

export default function Home() {
  const [name, setName] = useState("");
  const [simMetrics, setSimMetrics] = useState<Required<NumericMetricsMap>>({
    ap_03: 12000,
    ap_04: 62,
    ap_08: 18,
    ap_09: 6,
    ap_10: 58,
    ap_11: 41,
    ap_12: 55,
    ap_13: 47,
    ap_14: 38,
    ap_17: 900,
    ap_19: 9,
  });
  const [refReportOpen, setRefReportOpen] = useState(false);

  const router = useRouter();

  const simEvaluations = useMemo(() => evaluateAllBenchmarks(simMetrics), [simMetrics]);

  const annualInvoices = simMetrics.ap_03 * 12;
  const nonPoInvoicesAnnual = Math.round(annualInvoices * ((100 - simMetrics.ap_04) / 100));
  const exceptionInvoicesAnnual = Math.round(annualInvoices * (simMetrics.ap_08 / 100));
  const currentInvPerFte = Math.round((annualInvoices / simMetrics.ap_19 / 1000) * 10) / 10;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      router.push("/chat");
      return;
    }
    router.push(`/chat?client=${encodeURIComponent(trimmed)}`);
  }

  function applySimulatorPreset(mode: "harlow" | "india" | "global") {
    if (mode === "harlow") {
      setSimMetrics({
        ap_03: 12000,
        ap_04: 62,
        ap_08: 18,
        ap_09: 6,
        ap_10: 58,
        ap_11: 41,
        ap_12: 55,
        ap_13: 47,
        ap_14: 38,
        ap_17: 900,
        ap_19: 9,
      });
    } else if (mode === "india") {
      setSimMetrics({
        ap_03: 16600,
        ap_04: 85,
        ap_08: 8,
        ap_09: 4,
        ap_10: 55,
        ap_11: 70,
        ap_12: 75,
        ap_13: 20,
        ap_14: 45,
        ap_17: 660,
        ap_19: 5,
      });
    } else {
      setSimMetrics({
        ap_03: 22000,
        ap_04: 95,
        ap_08: 2,
        ap_09: 2,
        ap_10: 45,
        ap_11: 95,
        ap_12: 98,
        ap_13: 8,
        ap_14: 85,
        ap_17: 330,
        ap_19: 6,
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ey-grey-100 text-ey-black">
      <EyHeader subtitle="Fin OS · Accounts Payable Automation & Diagnostic">
        <button
          type="button"
          onClick={() => setRefReportOpen(true)}
          className="rounded border border-ey-grey-700 bg-ey-charcoal px-3.5 py-2 text-xs font-bold tracking-wide text-ey-white uppercase transition-colors hover:bg-ey-black"
        >
          View Sample Report
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(
              name.trim()
                ? `/chat?client=${encodeURIComponent(name.trim())}`
                : "/chat",
            )
          }
          className="rounded bg-ey-yellow px-4 py-2 text-xs font-extrabold tracking-wide text-ey-black uppercase transition-opacity hover:opacity-90"
        >
          Open Workbench →
        </button>
      </EyHeader>

      <main className="flex-1">
        {/* Hero Section with EY Navy & Yellow Beam Architecture */}
        <section className="relative overflow-hidden border-b border-ey-charcoal bg-ey-navy text-ey-white">
          <div
            className="pointer-events-none absolute top-0 right-[-12%] h-full w-1/3 bg-ey-yellow opacity-15"
            style={{ clipPath: "polygon(55% 0, 100% 0, 45% 100%, 0 100%)" }}
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-12 lg:items-center lg:py-16">
            {/* Left Hero Copy (7 cols) */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-ey-yellow px-3 py-1 text-xs font-extrabold tracking-[0.16em] text-ey-black uppercase">
                EY Finance Transformation Accelerator
              </div>
              <h1 className="mt-4 font-[var(--font-display)] text-3xl leading-tight font-black tracking-tight text-ey-white sm:text-4xl lg:text-5xl">
                Accounts Payable Automation &amp; Current-State Diagnostic
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ey-grey-200">
                Run a structured 22-field diagnostic across Procurement, 3-Way Match, Invoice Intake, Payment Execution, and Vendor Master Controls. Benchmark client volumetrics against{" "}
                <strong className="font-semibold text-ey-white">India and Global peer points</strong>, trace root-cause friction, and generate a board-ready diagnostic report with a{" "}
                <strong className="font-semibold text-ey-white">Sceptical CFO stress-test</strong>.
              </p>

              {/* Causal Chain Pill Strip */}
              <div className="mt-8 border-l-4 border-ey-yellow bg-ey-charcoal/90 p-4">
                <p className="font-[var(--font-display)] text-[11px] font-bold tracking-[0.18em] text-ey-yellow uppercase">
                  Core Diagnostic Causal Chain
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ey-white">
                  <span className="rounded bg-ey-black px-2.5 py-1">1. Low PO Coverage (ap_04)</span>
                  <span className="text-ey-yellow">→</span>
                  <span className="rounded bg-ey-black px-2.5 py-1">2. High Exceptions (ap_08)</span>
                  <span className="text-ey-yellow">→</span>
                  <span className="rounded bg-ey-black px-2.5 py-1">3. Slow Posting Cycle (ap_09)</span>
                  <span className="text-ey-yellow">→</span>
                  <span className="rounded bg-ey-black px-2.5 py-1">4. Late Payment &amp; Lost Discounts (ap_11 / ap_14)</span>
                  <span className="text-ey-yellow">→</span>
                  <span className="rounded bg-ey-black px-2.5 py-1">5. Query Load &amp; Low FTE Output</span>
                </div>
              </div>
            </div>

            {/* Right Intake & Quick-Start Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="animate-message-in rounded border border-ey-grey-700 bg-white p-6 text-ey-black shadow-xl sm:p-8">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-[var(--font-display)] text-xs font-extrabold tracking-wider text-ey-grey-700 uppercase">
                    Client Engagement Intake
                  </span>
                  <span className="rounded bg-ey-yellow px-2 py-0.5 font-mono text-[10px] font-extrabold text-ey-black uppercase">
                    22-Field V2 Spec
                  </span>
                </div>
                <h2 className="font-[var(--font-display)] text-xl font-extrabold text-ey-black">
                  Start an AP Diagnostic Session
                </h2>
                <p className="mt-1 mb-5 text-xs text-ey-grey-700">
                  Enter the client organisation name to personalise the interview, benchmark readouts, and branded PDF report.
                </p>

                <form onSubmit={handleSubmit}>
                  <label
                    htmlFor="clientName"
                    className="mb-1.5 block text-xs font-bold tracking-wide text-ey-black uppercase"
                  >
                    Client or Organisation Name
                  </label>
                  <input
                    id="clientName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Northwind Industrial Supplies"
                    autoFocus
                    className="mb-4 w-full rounded border border-ey-grey-200 bg-ey-grey-100/50 px-4 py-3 text-sm text-ey-black outline-none placeholder:text-ey-grey-400 focus:border-ey-black focus:bg-white focus:ring-2 focus:ring-ey-yellow"
                  />

                  <button
                    type="submit"
                    className="w-full rounded bg-ey-yellow px-6 py-3.5 font-[var(--font-display)] text-xs font-black tracking-wider text-ey-black uppercase transition-all hover:opacity-90 active:scale-[0.99]"
                  >
                    {name.trim()
                      ? `Start Diagnostic for ${name.trim()} →`
                      : "Start Fresh Diagnostic Interview →"}
                  </button>
                </form>

                <div className="mt-5 border-t border-ey-grey-200 pt-4">
                  <p className="mb-2.5 font-[var(--font-display)] text-[11px] font-bold tracking-wider text-ey-grey-700 uppercase">
                    Or Launch With a Pre-Configured Case:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/chat?client=${encodeURIComponent(
                            HARLOW_REFERENCE_CASE.clientName,
                          )}&preset=harlow`,
                        )
                      }
                      className="rounded border border-ey-grey-200 bg-ey-grey-100 px-3 py-2.5 text-left text-xs font-bold text-ey-black transition-colors hover:border-ey-black hover:bg-ey-yellow"
                    >
                      <span className="block font-[var(--font-display)] uppercase">
                        Harlow Industrial
                      </span>
                      <span className="text-[11px] font-normal text-ey-grey-700">
                        22/22 fields pre-loaded
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/chat?client=${encodeURIComponent(
                            "Northwind Industrial Supplies",
                          )}`,
                        )
                      }
                      className="rounded border border-ey-grey-200 bg-ey-grey-100 px-3 py-2.5 text-left text-xs font-bold text-ey-black transition-colors hover:border-ey-black hover:bg-ey-yellow"
                    >
                      <span className="block font-[var(--font-display)] uppercase">
                        Northwind Supplies
                      </span>
                      <span className="text-[11px] font-normal text-ey-grey-700">
                        Email + CSV extract case
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live AP Benchmark & Automation ROI Simulator */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-[var(--font-display)] text-xs font-extrabold tracking-[0.18em] text-ey-grey-700 uppercase">
                Interactive Benchmark &amp; Automation Simulator
              </span>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold text-ey-black">
                Test Client Volumetrics Against India &amp; Global Peer Points
              </h2>
              <p className="mt-1 text-sm text-ey-grey-700">
                Adjust the sliders to simulate how PO coverage, exception rates, and approval cycle times cascade across FTE productivity and working capital.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-ey-grey-700 uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => applySimulatorPreset("harlow")}
                className="rounded border border-ey-grey-200 bg-white px-3 py-1.5 text-xs font-bold text-ey-black hover:border-ey-black"
              >
                Harlow Baseline (62% PO)
              </button>
              <button
                type="button"
                onClick={() => applySimulatorPreset("india")}
                className="rounded border border-ey-grey-200 bg-white px-3 py-1.5 text-xs font-bold text-ey-black hover:border-ey-black"
              >
                India Benchmark (85% PO)
              </button>
              <button
                type="button"
                onClick={() => applySimulatorPreset("global")}
                className="rounded bg-ey-charcoal px-3 py-1.5 text-xs font-bold text-ey-white hover:bg-ey-black"
              >
                Global Leading (95% PO)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sliders Panel (5 cols) */}
            <div className="flex flex-col justify-between rounded border border-ey-grey-200 bg-white p-6 shadow-xs lg:col-span-5">
              <div className="space-y-4 tabular-nums">
                <SimulatorSlider
                  label="Monthly Invoice Volume (ap_03)"
                  value={simMetrics.ap_03}
                  min={1000}
                  max={50000}
                  step={500}
                  unit="inv/mo"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_03: v }))}
                />
                <SimulatorSlider
                  label="AP Team Headcount (ap_19)"
                  value={simMetrics.ap_19}
                  min={1}
                  max={40}
                  step={1}
                  unit="FTEs"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_19: v }))}
                />
                <SimulatorSlider
                  label="PO-Backed Invoices (ap_04 · Tier 1)"
                  value={simMetrics.ap_04}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  benchmarkNote="India: 85% · Global: 95%"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_04: v }))}
                />
                <SimulatorSlider
                  label="Invoice Exception Rate (ap_08 · Tier 1)"
                  value={simMetrics.ap_08}
                  min={1}
                  max={45}
                  step={1}
                  unit="%"
                  benchmarkNote="India: 8% · Global: 2%"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_08: v }))}
                />
                <SimulatorSlider
                  label="Receipt-to-Posting Cycle (ap_09)"
                  value={simMetrics.ap_09}
                  min={1}
                  max={20}
                  step={0.5}
                  unit="days"
                  benchmarkNote="India: 4d · Global: 2d"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_09: v }))}
                />
                <SimulatorSlider
                  label="Paid on Time vs. Terms (ap_11)"
                  value={simMetrics.ap_11}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  benchmarkNote="India: 70% · Global: 95%"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_11: v }))}
                />
                <SimulatorSlider
                  label="Days Payable Outstanding (ap_10)"
                  value={simMetrics.ap_10}
                  min={20}
                  max={95}
                  step={1}
                  unit="days"
                  benchmarkNote="India: 55d · Global: 45d"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_10: v }))}
                />
                <SimulatorSlider
                  label="Early-Payment Discount Capture (ap_14)"
                  value={simMetrics.ap_14}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  benchmarkNote="India: 45% · Global: 85%"
                  onChange={(v) => setSimMetrics((p) => ({ ...p, ap_14: v }))}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ey-grey-200 pt-4 tabular-nums">
                <div className="rounded bg-ey-grey-100 p-3">
                  <p className="text-[11px] font-semibold text-ey-grey-700">
                    Annual Non-PO Invoices
                  </p>
                  <p className="mt-0.5 font-[var(--font-display)] text-lg font-black text-ey-black">
                    {nonPoInvoicesAnnual.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-ey-grey-700">Bypass 3-way match</p>
                </div>
                <div className="rounded bg-ey-grey-100 p-3">
                  <p className="text-[11px] font-semibold text-ey-grey-700">
                    Annual Manual Exceptions
                  </p>
                  <p className="mt-0.5 font-[var(--font-display)] text-lg font-black text-ey-black">
                    {exceptionInvoicesAnnual.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-ey-grey-700">
                    {currentInvPerFte}k inv / FTE / yr
                  </p>
                </div>
              </div>
            </div>

            {/* Live Benchmark Table Output (7 cols) */}
            <div className="flex flex-col justify-between rounded border border-ey-grey-200 bg-white p-6 shadow-xs lg:col-span-7">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-[var(--font-display)] text-sm font-extrabold tracking-wider text-ey-black uppercase">
                    Live Benchmark Interpreter Output (10 Core KPIs)
                  </h3>
                  <span className="font-mono text-xs text-ey-grey-700">
                    sample-data/ap-benchmark-data.csv
                  </span>
                </div>

                <div className="overflow-x-auto border border-ey-grey-400">
                  <table className="w-full border-collapse text-left text-xs tabular-nums">
                    <thead>
                      <tr className="bg-ey-yellow text-ey-black">
                        <th className="border border-ey-grey-400 px-3 py-2 font-[var(--font-display)] font-extrabold uppercase">
                          Metric
                        </th>
                        <th className="border border-ey-grey-400 px-2.5 py-2 font-[var(--font-display)] font-extrabold uppercase">
                          Global
                        </th>
                        <th className="border border-ey-grey-400 px-2.5 py-2 font-[var(--font-display)] font-extrabold uppercase">
                          India
                        </th>
                        <th className="border border-ey-grey-400 px-2.5 py-2 font-[var(--font-display)] font-extrabold uppercase">
                          Simulated
                        </th>
                        <th className="border border-ey-grey-400 px-3 py-2 font-[var(--font-display)] font-extrabold uppercase">
                          Diagnostic Read
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {simEvaluations.map((ev) => (
                        <tr key={ev.spec.field_id} className="bg-white">
                          <td className="border border-ey-grey-200 px-3 py-2 font-bold text-ey-black">
                            {ev.spec.metric}
                          </td>
                          <td className="border border-ey-grey-200 px-2.5 py-2 text-ey-grey-700">
                            {ev.spec.global_benchmark}
                          </td>
                          <td className="border border-ey-grey-200 px-2.5 py-2 text-ey-grey-700">
                            {ev.spec.india_benchmark}
                          </td>
                          <td className="border border-ey-grey-200 px-2.5 py-2 font-extrabold text-ey-black">
                            {ev.formattedClient}
                          </td>
                          <td className="border border-ey-grey-200 px-3 py-2 text-ey-charcoal">
                            <span
                              className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                ev.position === "ahead"
                                  ? "bg-ey-teal text-white"
                                  : ev.position === "near"
                                    ? "bg-ey-charcoal text-white"
                                    : "bg-ey-yellow text-ey-black"
                              }`}
                            >
                              {ev.positionLabel}
                            </span>
                            {ev.dependencyWarning ?? ev.interpretation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded bg-ey-charcoal px-4 py-3 text-xs text-ey-white">
                <span>
                  Want a full 6-section diagnostic report and Sceptical CFO review?
                </span>
                <button
                  type="button"
                  onClick={() => setRefReportOpen(true)}
                  className="rounded bg-ey-yellow px-4 py-2 font-extrabold text-ey-black uppercase transition-opacity hover:opacity-90"
                >
                  Open Full Reference Report &amp; CFO Review →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* End-to-End AP Sub-Process Architecture (6 Stages from context/skills/) */}
        <section className="border-t border-ey-grey-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8">
              <span className="font-[var(--font-display)] text-xs font-extrabold tracking-[0.18em] text-ey-grey-700 uppercase">
                End-to-End AP Domain Architecture · 5 Sub-Process Review Skills
              </span>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold text-ey-black">
                Six Stages Covered by the EY AP Diagnostic Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {AP_SUBPROCESS_STAGES.map((stage) => (
                <div
                  key={stage.id}
                  className="flex flex-col justify-between rounded border border-ey-grey-200 bg-ey-grey-100/50 p-5 transition-colors hover:border-ey-black hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="bg-ey-yellow px-2.5 py-0.5 font-[var(--font-display)] text-xs font-black text-ey-black">
                        STAGE {stage.stepNumber}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-ey-grey-700">
                        /{stage.skillName}
                      </span>
                    </div>
                    <h3 className="mt-3 font-[var(--font-display)] text-base font-extrabold text-ey-black">
                      {stage.title}
                    </h3>
                    <p className="mt-1 inline-block rounded bg-ey-charcoal px-2 py-0.5 font-mono text-[11px] font-bold text-ey-yellow">
                      {stage.headlineBenchmark}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-ey-charcoal">
                      <strong className="text-ey-black">Failure Pattern:</strong>{" "}
                      {stage.keyRiskPattern}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-ey-grey-200 pt-3">
                    <p className="text-xs leading-relaxed text-ey-grey-700">
                      <strong className="text-ey-black">Automation &amp; Policy Lever:</strong>{" "}
                      {stage.automationLever}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {stage.fields.map((fid) => (
                        <span
                          key={fid}
                          className="rounded border border-ey-grey-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ey-black"
                        >
                          {fid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ReportPanel
        open={refReportOpen}
        onClose={() => setRefReportOpen(false)}
        status="done"
        text={HARLOW_REFERENCE_REPORT_MD}
        clientName={HARLOW_REFERENCE_CASE.clientName}
      />
    </div>
  );
}

function SimulatorSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  benchmarkNote,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  benchmarkNote?: string;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold text-ey-black">{label}</span>
        <div className="flex items-baseline gap-2">
          {benchmarkNote && (
            <span className="text-[10px] text-ey-grey-700">({benchmarkNote})</span>
          )}
          <span className="font-mono font-extrabold text-ey-black">
            {value.toLocaleString()} {unit}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded bg-ey-grey-200 accent-ey-black"
      />
    </div>
  );
}

