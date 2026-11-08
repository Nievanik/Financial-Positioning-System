# Phases — Build Order

**Project:** Financial Positioning System (FPS) — HackUTD 2026  
**Purpose:** Fixed development roadmap. Edit only when scope, dependencies, or build order genuinely changes. Track day-to-day work in GitHub Issues or the team’s preferred task board—not in this roadmap.

**Order rationale:** **Data contract and financial logic first; frontend in parallel with mocked API responses.** A working, trustworthy PNC 360° financial picture powered by Capital One Nessie is the priority. Build the deterministic calculations before adding AI explanations. Reuse the same forecast/scenario engine for Toyota only after the PNC + Nessie MVP works end to end.

**Priority rule:**
- **Must ship:** PNC 360° overview, Nessie-powered synthetic banking data, three or more health indicators, 1/2/3/6-month forecasts, and working what-if scenarios.
- **Add after core works:** Calculation-backed next-best actions and AI explanations/coach.
- **Stretch:** Toyota vehicle-financing module; never let it delay a complete PNC + Nessie demo.


---

## Phase 0 — Foundation & Project Contracts
**Existing documents (keep as the source of truth):**
- [x] `TechStack.md` — finalized tools, frameworks, hosting, and integrations.
- [x] `requirements.md` — product scope, MVP features, and priorities.
- [x] `Phases.md` — this fixed build-order roadmap.

**Documents to write, in this order:**
- [ ] **`engineering.md`** — agree on the full project folder structure (`client/`, `server/`, `docs/`), MongoDB/Mongoose database schema and relationships, Nessie-to-FPS data mapping, REST API routes, request/response examples, validation/error formats, and core financial-engine data contracts.
- [ ] **`design.md`** — define the frontend design templates: page layouts, navigation, dashboard structure, reusable components, colors/typography/spacing, chart conventions, responsive behavior, and loading/empty/error states using Tailwind CSS + shadcn/ui.
- [ ] Review `engineering.md` and `design.md` against `requirements.md` and `TechStack.md`; resolve mismatches before implementation.

**Project setup:**
- [ ] Create/confirm the GitHub monorepo structure according to `engineering.md`; use feature branches and pull requests through a shared integration branch before merging to `main`.
- [ ] Set up `.agent/skills/` and `.agent/workflows/` only if the chosen coding agents need them.
- [ ] Scaffold `client/` with React + Vite + **JavaScript**, Tailwind CSS, shadcn/ui, and Recharts.
- [ ] Scaffold `server/` with Node.js + Express + **JavaScript** and Mongoose; configure MongoDB Atlas connection.
- [ ] Configure environment-variable examples, `.gitignore`, CORS, lint/run scripts, native `fetch`/REST, and `/api/health`.
- [ ] Create frontend mock JSON matching the API responses specified in `engineering.md` so UI work can begin in parallel.

**Exit gate:** `engineering.md` and `design.md` are agreed; repository structure matches the engineering design; the app runs locally and frontend can reach `/api/health`.

## Phase 1 — Core Data Layer & Nessie Integration
- [ ] Configure Capital One Nessie access **server-side**; never expose credentials in the React/Vite bundle.
- [ ] Define MongoDB/Mongoose models for demo profiles, accounts, transactions, obligations, and supplemental financial data.
- [ ] Import and normalize available Nessie data (accounts, purchases/transactions, bills, transfers, and applicable loan/payment data) into the app's common schema.
- [ ] Add clearly labeled synthetic records for finances Nessie does not provide reliably (e.g., income details, retirement/IRA, CDs, mortgage or vehicle terms, savings contributions).
- [ ] Keep **spendable cash**, savings/investments/retirement, debts, and unused credit **separate**; identify transfers and card payments to prevent double-counting.
- [ ] Support at least two selectable, realistic demo profiles and a reproducible seed/refresh script.
- [ ] Build REST endpoints for profiles, financial summary, transactions/spending, and bills/debts; handle empty and failed data loads.

**Exit gate:** Selecting any demo profile returns consistent, labeled financial data through working Express endpoints, even when Nessie is temporarily unavailable (using previously seeded demo data).

## Phase 2 — Financial Analysis & Forecast Engine
- [ ] Categorize historical spending (e.g., groceries, housing, transport, entertainment); compute monthly income, expenses, net cash flow, and recurring obligations.
- [ ] Implement **three or more explainable indicators**: emergency-fund coverage, debt-payment burden, and cash-flow safety (plus others only if useful).
- [ ] Build a deterministic forecast for **1, 2, 3, and 6 months**, using opening spendable cash, expected income, recurring spending, debt payments, and planned savings contributions.
- [ ] Model payment due dates and important cash-flow events to flag **intra-month shortfalls**, not only negative month-end balances.
- [ ] Document assumptions and distinguish liquid cash from retirement balances and available credit in all calculations.
- [ ] Return structured results and drivers from the API: projected balances, upcoming obligations, risk flags, health scores/labels, and assumption summaries.
- [ ] Unit-test calculation cases: zero income, heavy debt, one-time purchases, recurring payments, transfers/card-payment deduplication, and negative cash balances.

**Exit gate:** For a seeded profile, tests and API responses reproduce explainable 1/2/3/6-month projections and correctly identify a known cash-shortfall scenario.

## Phase 3 — Unified Dashboard & Forecast Experience
- [ ] Build the main dashboard layout and **demo-profile selector** (no login or authentication required).
- [ ] Display cash, savings, retirement/investments, debts, credit usage, and net worth without conflating these values.
- [ ] Show categorized past spending, income vs. expenses, and upcoming bills/loan payments.
- [ ] Visualize the three or more financial health indicators with plain-language descriptions and calculation details.
- [ ] Use Recharts to show the 1/2/3/6-month forecast, projected balance changes, and cash-shortfall warnings.
- [ ] Connect screens to real Express endpoints via native `fetch`; remove placeholder figures from the core demo flow.
- [ ] Handle loading, empty, error, and profile-switch states clearly.

**Exit gate:** A judge can select a profile, understand its current position, inspect spending and health indicators, and see its future cash outlook using real backend results.

## Phase 4 — What-If Simulator, Guidance & Toyota Extension
**Core — complete before stretch work:**
- [ ] Create a what-if interface for **one-time expenses**, **monthly recurring changes**, and **down-payment + recurring-payment** scenarios (e.g., a vehicle purchase).
- [ ] Recalculate through the **same Phase 2 engine**; compare baseline vs. scenario at 1/2/3/6 months, including shortfall dates and changed indicators.
- [ ] Generate at least one **calculation-backed next-best action** per relevant financial situation, including its rationale and trade-offs.
- [ ] Add AI-generated plain-language explanations or a conversational coach **if the application AI provider is selected and integration is stable**. Feed it computed facts; never let it invent balances, forecasts, approvals, or eligibility.
- [ ] Provide a deterministic, non-AI explanation fallback so the demo works without an AI response.

**Stretch — only after the PNC + Nessie core is fully working:**
- [ ] Add a Toyota profile with labeled synthetic vehicle and financing data.
- [ ] Compare realistic vehicle choices (e.g., keep current vehicle, pay down loan, refinance, replace) using the existing forecast/what-if engine and explicit assumptions.
- [ ] Show payment/cash-flow trade-offs and an appropriate suggested next step; avoid claims of guaranteed offers or approval.

**Exit gate:** A judge can change a financial assumption, see a numerically consistent before/after comparison, and receive an actionable explanation. Toyota is optional and must not block this gate.

## Phase 5 — Integration & Hardening
- [ ] Run end-to-end flows: select profile → inspect dashboard → view health/forecast → run scenario → read recommendation.
- [ ] Verify data consistency across Nessie import, MongoDB, financial engine, APIs, charts, simulator, and guidance.
- [ ] Audit system-boundary errors: missing data, failed Nessie/API requests, MongoDB disconnection, invalid scenario inputs, and AI timeout/failure.
- [ ] Confirm synthetic/estimated values are labeled; no secrets appear in frontend builds, logs, or Git.
- [ ] Validate no double-counting; confirm negative balances, due dates, and transfer/card-payment handling.
- [ ] Deploy frontend and backend to **Render**; set Atlas/network configuration, environment variables, and production API/CORS settings.
- [ ] Pass the agreed MVP acceptance tests (maintained as GitHub issues or a test checklist) against the deployed application.

**Exit gate:** The hosted PNC + Nessie MVP completes its core demo flow without manual fixes or dependency on a live AI response.

## Phase 6 — Polish & Presentation
- [ ] Complete responsive-layout, readability, accessibility, and interaction polish for the demo screens.
- [ ] Refine charts, labels, tooltips, assumptions, and risk/recommendation wording for non-technical judges.
- [ ] Polish `README.md`: problem, solution, sponsors/track fit, stack, architecture, local setup, demo instructions, and team contributions.
- [ ] Freeze and verify reproducible demo profiles with contrasting outcomes (healthy finances and a cash-shortfall case).
- [ ] Prepare a short presentation/demo script: **Understand → Predict → Optimize**; show the before/after result live.
- [ ] Capture screenshots and a backup demo video; rehearse the presentation and verify the deployed link.
- [ ] Finish submission requirements and perform one final smoke test of the hosted application.

**Exit gate:** A judge can follow the full financial story quickly, the team can demonstrate it reliably, and submission assets are ready.

---

## Notes
- **Roadmap vs. tracking:** Keep these phases stable. Use GitHub Issues/Projects or a task board for day-to-day progress, assignments, blockers, and completion; do not rewrite this file every session.
- **Parallel execution:** Phase 1 backend and Phase 3 UI shell may start in parallel after the Phase 0 `engineering.md` API contracts are agreed; UI can use mock responses until Phase 1/2 endpoints are ready. Phase 2 calculations can be built against seeded fixtures.
- **Dependencies:** `engineering.md` must be finalized before core models and API implementation; `design.md` must be ready before UI implementation. The dashboard's final numbers require Phases 1–2. The what-if comparison and Toyota extension require Phase 2's shared engine. AI explanations require validated calculated outputs, not the reverse.
- **Scope control:** Do **not** add login, extra cloud providers, a second database, or unrelated sponsor integrations. Keep one React/Vite client, one Express server, and MongoDB Atlas.
- **Truthfulness of financial outputs:** This is a prototype using mock/synthetic finances. Forecasts are estimates; recommendations are educational and are not bank decisions, loan offers, or guaranteed results.
- **Unresolved technical decisions:** Choose the application AI provider and the forecast implementation details during the relevant phase; do not delay the deterministic core while evaluating them.
- **If time runs short:** Stop Toyota work first, then optional AI conversation. Preserve the functioning Nessie → dashboard → indicators/forecast → what-if → action demo.
