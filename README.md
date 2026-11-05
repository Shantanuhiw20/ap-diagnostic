# EY Fin OS — Accounts Payable Automation & Diagnostic Platform

An AI-powered Accounts Payable (AP) diagnostic, peer benchmarking, and process automation assessment platform built in EY's visual identity with Next.js 16 and Tailwind CSS v4.

## Key Capabilities

1. **Interactive AP Benchmark & Automation Simulator**:
   - Model client volumetrics against **10 authoritative Global and India peer benchmarks** (`context/sample-data/ap-benchmark-data.csv`).
   - Enforces causal and paired-metric interpretation rules (`context/skills/benchmark-interpreter/SKILL.md`), such as reading DPO alongside Paid-on-Time and normalising per-FTE productivity for non-PO share.
2. **AI Diagnostic Interview & File Reader (`/chat`)**:
   - Structured 9-question causal-chain interview plus full **22-field V2 AP Checklist** audit (`context/sample-data/ap-data-collection-template-v2.csv`).
   - Supports `.txt` narrative email and `.csv` invoice aging extract uploads with automated PO vs. non-PO cross-tabulation and vendor spend concentration (`context/skills/file-reader/SKILL.md`).
3. **Six-Section Diagnostic Report & Branded PDF Export**:
   - Generates a complete diagnostic report (Executive Summary, As-is Observations tagged by Impact/Ease/Dimension/Timeframe, Maturity Assessment across 6 sub-processes, Benchmarking, Opportunities by Lever, and Phased Next Steps).
   - Exports a selectable, paginated **EY-branded PDF** following `context/sample-data/design.md`.
4. **Sceptical CFO Stress-Test Reviewer (`/api/review`)**:
   - Audits the draft report using `context/agents/reviewer.md` to surface unquantified claims, missing reason-code splits, and business-case gaps before client delivery.

## Deploying on Vercel

This repository is ready to deploy directly to **Vercel** with zero configuration required:

1. Push this repository to GitHub / GitLab / Bitbucket and import it into [Vercel](https://vercel.com/new).
2. **Zero-Config Built-In Engine**: Out of the box (with no environment variables set), the app runs using the built-in **EY AP Diagnostic Engine** (`lib/providers/ap-diagnostic-engine.ts`), supporting live interviews, file extraction, 6-section report generation, and CFO stress-test reviews.
3. **Optional Live LLM Environment Variables**:
   - `ANTHROPIC_API_KEY`: Automatically routes `/api/chat`, `/api/report`, and `/api/review` to Anthropic Claude (`AI_MODEL` defaults to `claude-sonnet-4-20250514`).
   - `OPENAI_API_KEY`: Automatically routes requests to OpenAI (`AI_MODEL` defaults to `gpt-4o`).
   - `SITE_PASSWORD`: Optional HTTP Basic Auth password gate across all pages and API routes (configured in `proxy.ts`).

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

