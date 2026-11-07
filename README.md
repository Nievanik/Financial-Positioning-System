# Financial Positioning System (FPS)

**HackUTD 2026** · **PNC 360° Financial Health Navigator** · **Capital One Nessie API**

A financial decision assistant that brings a person's financial information into one view, forecasts available cash, and helps answer: **“Can I afford this decision, and what is my smartest next move?”**

> **Project status:** Hackathon MVP in development. The features and stack below describe the intended implementation, not a completed deployment.

## The idea

**Understand My Finances → Predict My Future → Optimize My Decisions**

FPS combines synthetic bank data, spending analysis, cash-flow projections, and interactive “what-if” scenarios. It uses transparent calculations for numbers and AI to explain the results in plain language.

## Core features (MVP)

1. **360° financial dashboard** — Checking and savings balances, credit-card balances and limits, income, outstanding loans and payments, upcoming bills, and retirement/other savings. Clearly distinguish available cash from investments, retirement savings, and unused credit.
2. **Spending analysis** — Group historical transactions (groceries, housing, transport, entertainment, subscriptions, etc.) and estimate recurring versus variable expenses.
3. **Cash-flow forecast** — Project available cash at **1, 2, 3, and 6 months**, accounting for income, bills, loan payments, spending, and savings contributions. Flag possible shortfalls *between* month-end checkpoints.
4. **What-if simulator** — Compare a baseline against (a) a **one-time purchase**, such as a $2,000 laptop, and (b) a **down payment plus recurring payments**, such as $10,000 down and $3,000/month.
5. **Financial health indicators** — Show at least **three explainable metrics**, such as emergency savings coverage, debt-payment burden, and projected cash-flow safety.
6. **Next-best move / AI coach** — Recommend an actionable alternative (delay a purchase, adjust discretionary spending, etc.), quantify its forecast impact, and explain the trade-offs. **Financial math is deterministic; AI does not invent balances or predictions.**

## Planned tech stack

| Layer | Technology |
| --- | --- |
| Web app | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Next.js Route Handlers |
| Banking data | Capital One [Nessie API](https://nessieisreal.com/) (mock data) |
| Database | PostgreSQL / Tiger Data + Prisma (if needed for persisted scenarios) |
| AI explanations | Gemini API |
| Calculation engine | TypeScript (date-based cash-flow logic) |
| Hosting | Vultr (planned) |

**Priority:** A working end-to-end Nessie → dashboard → forecast → what-if → recommendation experience comes before adding optional infrastructure or sponsor integrations.

## Getting started (once the app is scaffolded)

Requirements: Node.js and npm, plus a Nessie API key. Gemini and database credentials are only necessary when those integrations are enabled.

```bash
npm install
cp .env.example .env.local  # if an example file exists
npm run dev
```

Open **http://localhost:3000**.

Suggested environment variable names (confirm against the implementation):

```dotenv
NESSIE_API_KEY=your_nessie_api_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
```

**Never commit real API keys.** Nessie and Gemini requests containing secrets should be made server-side.

## Demo flow

1. Load a **fictional customer** from Nessie, with clearly labeled additional mock fields if needed.
2. Show account overview, spending categories, and three health indicators.
3. Display the 1/2/3/6-month cash-flow forecast and any predicted shortage dates.
4. Simulate a one-time purchase and a recurring commitment; display **before vs. after** projections.
5. Recommend a numerically supported next move and explain why.

## Scope and safeguards

- **Synthetic data only.** Nessie is a sandbox, **not** live access to personal banking accounts. Additional data (e.g., IRA details or mortgages not represented by Nessie) must be labeled synthetic.
- **No double-counting.** Transfers, card purchases versus repayments, and savings contributions need consistent bookkeeping.
- **No misleading affordability claims.** Six-month cash projections do not establish long-term mortgage affordability or loan approval. Forecasts are estimates based on stated assumptions.
- **Out of MVP scope:** Real account linking, payments/transfers of real money, investment trading, automated underwriting, and the Toyota module.

## Later phase: Toyota Financial Services

Reuse the same forecast and what-if engine for simulated Toyota vehicle/loan/lease decisions: compare **keep, pay off, refinance, or replace** options, explaining cost, monthly cash-flow impact, and realistic next steps. This is **not required for the first MVP**.

## Team collaboration

**Team size:** 3. Suggested parallel workstreams (assign owners as a team):

- **Data + integration:** Nessie responses, normalization, synthetic fields, API routes.
- **Financial engine:** Spending categories, indicators, forecasts, scenarios, unit tests.
- **Frontend + explanation:** Dashboard, charts, scenario UI, Gemini-powered explanations, demo.

**Definition of done:** One reproducible demo where a user can inspect finances, spot a risk, test at least two decision types, and understand a recommendation supported by the computed numbers.

For the full feature checklist and boundaries, see [`HackUTD_2026_PNC_Capital_One_Requirements.md`](./HackUTD_2026_PNC_Capital_One_Requirements.md).
