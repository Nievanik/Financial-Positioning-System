# Financial Positioning System (FPS)

**HackUTD 2026** · **PNC 360° Financial Health Navigator** · **Capital One Nessie API**

A financial decision assistant that brings a person's finances into one view, forecasts available cash, and helps answer: **“Can I afford this decision, and what is my smartest next move?”**

> **Status:** Hackathon MVP in development. The features and architecture below describe the intended implementation, not a completed deployment.

## The idea

**Understand My Finances → Predict My Future → Optimize My Decisions**

FPS combines synthetic banking data, spending analysis, cash-flow forecasts, and interactive “what-if” scenarios. The application computes financial figures and uses an AI assistant (provider to be selected) to explain results in plain language.

## Core features (MVP)

1. **360° financial dashboard** — Checking and savings balances, credit-card balances and limits, income, outstanding loans and payments, upcoming bills, and retirement/other savings. Distinguish available cash from investments, retirement savings, and unused credit.
2. **Spending analysis** — Categorize historical transactions (groceries, housing, transportation, entertainment, subscriptions, etc.) and estimate recurring versus variable expenses.
3. **Cash-flow forecast** — Project available cash at **1, 2, 3, and 6 months**, accounting for income, bills, loan payments, spending, and savings contributions. Flag potential shortfalls *between* month-end checkpoints.
4. **What-if simulator** — Compare a baseline against (a) a **one-time purchase**, such as a $2,000 laptop, and (b) a **down payment plus recurring payments**, such as $10,000 down and $3,000/month.
5. **Financial health indicators** — Show at least **three understandable metrics**, such as emergency savings coverage, debt-payment burden, and projected cash-flow safety.
6. **Next-best move / AI coach** — Suggest alternatives (delay a purchase, reduce discretionary spending, etc.), show their computed forecast impact, and explain trade-offs. **AI must not invent financial balances or projections.**

## Finalized tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React + Vite + JavaScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Express.js + Node.js (JavaScript) |
| Database | MongoDB Atlas + Mongoose |
| Banking data | Capital One [Nessie API](https://nessieisreal.com/) — synthetic data |
| Data strategy | Import Nessie data into MongoDB; refresh when needed |
| Client/server communication | Native `fetch` + REST API |
| Deployment | Render Static Site (client) + Render Web Service (server) |
| Development assistants | Claude + Codex |

**Decided in `docs/engineering.md`:** deterministic daily cash-flow forecast, exactly 3 read-only demo profiles, temporary (unsaved) what-if scenarios. **Not yet decided:** in-app AI API provider (a template fallback is always provided). Claude and Codex are development assistants, **not** automatically the in-app AI provider.

For architecture, technology boundaries, and deployment details, see [`docs/techstack.md`](./docs/techstack.md).

## Repository structure

```text
Financial-Positioning-System/
├── client/           # React + Vite
├── server/           # Express.js + Mongoose + Nessie integration
├── docs/             # requirements.md, techstack.md, engineering.md, phases.md
└── README.md
```

## Getting started (after scaffolding)

**Prerequisites:** Node.js, npm, a MongoDB Atlas connection string, and a Nessie API key. No end-user login is planned; the demo uses selectable fictional customer profiles.

Run the frontend and backend in separate terminals:

```bash
# Terminal 1
cd server
npm install
npm run dev

# Terminal 2 (from repository root)
cd client
npm install
npm run dev
```

These commands assume each package has been scaffolded with a `dev` script. Vite commonly uses `http://localhost:5173`; the Express port will be set by the server configuration.

Illustrative environment variables (names to confirm when implementing):

```dotenv
# server/.env (server only)
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
NESSIE_API_KEY=your_nessie_api_key

# client/.env (public configuration only)
VITE_API_BASE_URL=http://localhost:5000
```

Any future in-app AI provider key belongs **only in the backend environment**. Never commit `.env` files or API keys, and never expose secrets through `VITE_` variables.

## Data flow

1. Use Nessie to obtain a **fictional customer** and available mock banking data.
2. Normalize/import these records into MongoDB; supplement unsupported account or obligation fields with **clearly labeled synthetic data**.
3. Load a selectable demo profile into the dashboard.
4. Compute the spending breakdown, three health indicators, and **1/2/3/6-month forecast**.
5. Simulate a one-time expense and a recurring commitment; display **before vs. after** results and risks.
6. Present a concrete, numerically supported recommendation, with an AI explanation when the AI integration is enabled.

**Priority:** Build a working **Nessie → dashboard → forecast → what-if → recommendation** flow before adding optional capabilities.

## Scope and safeguards

- **Synthetic data only:** Nessie is a sandbox, not a live connection to personal banking accounts.
- **No user authentication:** Use selectable demo profiles; don't collect real bank credentials.
- **No double-counting:** Account transfers, card purchases vs. repayments, and savings contributions need consistent bookkeeping.
- **Avoid misleading claims:** Six-month projections are estimates, not guaranteed outcomes, mortgage qualification, or loan approval.
- **Not in the MVP:** Real account linking, real money transfers, trading, automated underwriting, or the Toyota module.

## Later phase: Toyota Financial Services

Reuse the same financial analysis and scenario capabilities for simulated vehicle/loan/lease decisions such as **keep, pay off, refinance, or replace**. Compare monthly cash flow and trade-offs with realistic next-step guidance. **Toyota is planned after the initial MVP.**

## Team collaboration

**Team size:** 3 developers, working in one GitHub repository (`client/` + `server/`) with feature branches and pull requests.

Work on short-lived `feature/*` branches, open PRs into `dev`, and merge tested work from `dev` into `main`. Roles are flexible; there are no fixed lanes.

**Definition of done:** A reproducible demo where a fictional customer can inspect finances, identify a potential risk, compare both scenario types, and understand an action supported by the computed figures.

See [`docs/requirements.md`](./docs/requirements.md) for the concise feature requirements.
