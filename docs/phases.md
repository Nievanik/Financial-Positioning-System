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
- [x] `techstack.md` — finalized tools, frameworks, hosting, and integrations.
- [x] `requirements.md` — product scope, MVP features, and priorities.
- [x] `phases.md` — this fixed build-order roadmap.

**Documents to write, in this order:**
- [x] **`engineering.md`** — agreed on the full project folder structure (`client/`, `server/`, `docs/`), MongoDB/Mongoose database schema and relationships, Nessie-to-FPS data mapping, REST API routes, request/response examples, validation/error formats, and core financial-engine data contracts.
- [x] **`design.md`** — define the frontend design templates: page layouts, navigation, dashboard structure, reusable components, colors/typography/spacing, chart conventions, responsive behavior, and loading/empty/error states using Tailwind CSS + shadcn/ui.
- [ ] Review `engineering.md` and `design.md` (once written) against `requirements.md` and `techstack.md`; resolve mismatches before implementation.

**Project setup:**
- [x] Create/confirm the GitHub monorepo structure according to `engineering.md` (`client/`, `server/`, `docs/`, `dev` branch); use feature branches and pull requests through a shared integration branch before merging to `main`.
- [x] Set up agent skills — project-local `.claude/skills/` (`tailwind-v4-shadcn`, `react-vite-best-practices`, `recharts`); `.agent/workflows/` not needed.
- [x] Scaffold `client/` with React + Vite + **JavaScript**, Tailwind CSS, shadcn/ui, and Recharts.
  - [x] React + Vite + JavaScript, Recharts (plus React Router, lucide-react), moved into `client/`
  - [x] Tailwind CSS v4 and shadcn/ui (Button, Card)
  - [x] Replaced the Vite template `App.jsx`; added `lib/api.js` fetch wrapper
- [x] Scaffold `server/` with Node.js + Express + **JavaScript** and Mongoose; configure MongoDB Atlas connection (verified connected).
- [x] Configure environment-variable examples, `.gitignore`, CORS, lint/run scripts, native `fetch`/REST, and `/api/v1/health`.
  - [x] `server/.env.example`, `.env` gitignored, CORS, `dev`/`start` scripts, `GET /api/v1/health`
  - [x] `client/.env.example` (`VITE_API_BASE_URL`), client `fetch` call to `/api/v1/health`, client lint
  - [ ] Server lint script (optional)
- [x] Create frontend mock JSON matching the API responses specified in `engineering.md` so UI work can begin in parallel. *(Done: `client/src/mocks/` holds real API responses for the 3 profiles; regenerate with `npm run export:mocks` in `server/`.)*

**Exit gate:** `engineering.md` and `design.md` are agreed; repository structure matches the engineering design; the app runs locally and frontend can reach `/api/v1/health`.

## Phase 1 — Core Data Layer & Nessie Integration
- [x] Configure Capital One Nessie access **server-side**; never expose credentials in the React/Vite bundle.
  - [x] API key obtained and verified with live read/write calls (findings recorded in `engineering.md` section 6)
  - [x] Server-side Nessie client (`services/nessie/client.js`, 3 tests with injected `fetch`): requires `status`, whitelists transfer keys, never exposes `?key=` URLs. Payloads for customer/account/deposit/withdrawal/bill/loan verified live on 2026-11-08 (see `engineering.md` section 6 gotchas); purchases/transfers rely on the earlier write test
- [x] Define MongoDB/Mongoose models for demo profiles, accounts, transactions, obligations, and supplemental financial data. *(`server/src/models/`: DemoProfile, Account, Transaction, Loan, RecurringCashFlow; integer-cents validation and indexes per `engineering.md` 3.4. No DB-level tests yet; the seed will exercise them.)*
- [x] *(Done 2026-11-08: `server/scripts/`, `npm run seed`, 3 tests; posted to Nessie and read back, balances and record counts match; customer ids saved in MongoDB `demoProfiles`. Do NOT re-run `--post`.)* Seed the 3 fictional customers, accounts, transactions, bills and loans **into Nessie** (balances must be set explicitly because Nessie does not derive them; encode transfer counterparties in `description`).
- [x] Import and normalize available Nessie data (accounts, purchases/transactions, bills, transfers, and applicable loan/payment data) into the app's common schema. *(Done: `npm run sync:nessie`, `normalize.js`, 3 tests; synced and idempotent.)*
- [x] Add clearly labeled synthetic records for finances Nessie does not provide reliably (e.g., income details, retirement/IRA, CDs, mortgage or vehicle terms, savings contributions). *(Done for credit limit, 401(k), gross pay, loan due day/rate; no CD/mortgage in the 3 profiles.)*
- [x] Keep **spendable cash**, savings/investments/retirement, debts, and unused credit **separate**; identify transfers and card payments to prevent double-counting. *(Done: `overview.cash` vs `totals`; transfers net zero, card purchases `cashImpactCents = 0`; covered by `snapshot.test.js` and `syncNormalize.test.js`.)*
- [x] Seed **exactly three** selectable, read-only demo profiles with contrasting outcomes (healthy, debt pressure, cash-shortfall) using a frozen `asOf` date, plus a reproducible seed/refresh script. Document which fields come from Nessie vs. supplemental synthetic data. *(Done; Nessie side is not re-seedable because there is no DELETE; Nessie-vs-supplemental fields documented in `engineering.md` section 6.)*
- [x] Build REST endpoints for profiles, financial summary, transactions/spending, and bills/debts; handle empty and failed data loads. *(Done: profiles, overview, transactions, spending, health-metrics, forecast, scenarios/evaluate, recommendations in `routes/profiles.routes.js`; smoke-tested live. Failed-DB returns 503. Explanations route and rate limiting added later; caching still open.)*

**Exit gate:** Selecting any demo profile returns consistent, labeled financial data through working Express endpoints, even when Nessie is temporarily unavailable (using previously seeded demo data).

## Phase 2 — Financial Analysis & Forecast Engine
- [ ] Categorize historical spending (e.g., groceries, housing, transport, entertainment); compute monthly income, expenses, net cash flow, and recurring obligations.
  - [x] Category spending (`GET /spending`), fixed vs. variable monthly spend, recurring obligations (`overview.obligations`)
  - [x] Monthly income and net cash flow (`GET /spending` income/expenses/net fields; `GET /overview` `income[]`)
- [x] Implement **three or more explainable indicators**: emergency-fund coverage, debt-payment burden, and cash-flow safety (plus others only if useful).
  - Done in `engine/indicators.js` (raw metrics). Still open: health labels/thresholds (not defined in `engineering.md`).
- [x] Build a deterministic forecast for **1, 2, 3, and 6 months**, using opening spendable cash, expected income, recurring spending, debt payments, and planned savings contributions.
  - Done in `server/src/engine/forecast.js`; run tests with `npm test` in `server/`.
- [x] Model payment due dates and important cash-flow events to flag **intra-month shortfalls**, not only negative month-end balances.
- [ ] Document assumptions and distinguish liquid cash from retirement balances and available credit in all calculations.
- [x] Return structured results and drivers from the API: projected balances, upcoming obligations, risk flags, health scores/labels, and assumption summaries. *(Done via forecast, health-metrics, spending, overview endpoints; health labels still undefined.)*
- [ ] Unit-test calculation cases *(covered so far: shortfall/negative cash, one-time and recurring flows, loan counted once, month-end clipping, indicators, scenarios; still missing: zero income, heavy debt, transfer/card dedup at input-build time)*: zero income, heavy debt, one-time purchases, recurring payments, transfers/card-payment deduplication, and negative cash balances.

**Exit gate:** For a seeded profile, tests and API responses reproduce explainable 1/2/3/6-month projections and correctly identify a known cash-shortfall scenario.

## Phase 3 — Unified Dashboard & Forecast Experience
- [x] Build the main dashboard layout and **demo-profile selector** (no login or authentication required). *(`?profile=slug`; mobile drawer.)*
- [x] Display cash, savings, retirement/investments, debts, credit usage, and net worth without conflating these values. *(Stat cards + Balances & net worth panel.)*
- [x] Show categorized past spending, income vs. expenses, and upcoming bills/loan payments. *(SpendingPanel donut + income/expenses/net row, TransactionsPanel with category filter, UpcomingPanel.)*
- [x] Visualize the three or more financial health indicators with plain-language descriptions and calculation details. *(HealthPanel: N/3 ring, pills + meters per threshold, "How we calculate this".)*
- [x] Use Recharts to show the 1/2/3/6-month forecast, projected balance changes, and cash-shortfall warnings. *(ForecastPanel: 1M/2M/3M/6M, floor line, red below-floor segment + first-shortfall marker, insight text from `POST /explanations`.)*
- [x] Connect screens to real Express endpoints via native `fetch`; remove placeholder figures from the core demo flow.
- [x] Handle loading, empty, error, and profile-switch states clearly. *(Per-card skeleton/error+retry; backend-down banner checked; profile switch aborts in-flight requests.)*
- [x] **Edit profile data** (scope change 2026-11-07, `engineering.md` 5.4): "Edit data" dialog in the top bar edits balances, income/bills (rent etc.), loans (with their single payment flow) and monthly spending estimates; the dashboard refetches after each save. Verified live against Atlas (forecast moves with each edit, test edits reverted). *(Not done: no route-level tests (validators are unit-tested in `services/edits.test.js`); no undo, so reset shared data with `npm run sync:nessie`, which also overwrites edits to Nessie rows but does not remove `user_entered` rows; mocks have no `/editable`, so the dialog shows an error in mock mode.)*
  - [x] Option A integration (2026-11-08, `feature/demo-hybrid`): editor ported into the three-page app's design system (header "Edit data"; disabled with an explanation in mock mode); every save clears the client cache and remounts the page so the Dashboard, Simulator and Investment Planner all refetch. Verified on a disposable local MongoDB (not Atlas): balance, CD, bill add/delete and spending-estimate edits update cash, long-term totals, net worth and the forecast on every page.

**Exit gate:** A judge can select a profile, understand its current position, inspect spending and health indicators, and see its future cash outlook using real backend results.

## Phase 4 — What-If Simulator, Guidance & Toyota Extension
**Core — complete before stretch work:**
- [x] Create a what-if interface for **one-time expenses**, **down-payment + recurring-payment** scenarios, and **monthly spending reductions** (`monthly_spending_reduction`, used by recommendations).
- [ ] Recalculate through the **same Phase 2 engine**; compare baseline vs. scenario at 1/2/3/6 months, including shortfall dates and changed indicators.
  - [x] Engine: `engine/scenarios.js` (`evaluateScenario`) + tests; baseline vs. scenario checkpoints, deltas, first shortfall date
  - [x] `POST /scenarios/evaluate` route (422 on invalid scenarios, rate limited)
  - [ ] Changed indicators in the comparison, UI *(UI done for checkpoints, deltas, first shortfall date and the chart overlay; the API does not return scenario health indicators yet)*
- [ ] Generate at least one **calculation-backed next-best action** per relevant financial situation, including its rationale and trade-offs.
  - [x] Engine: delay-one-month and cut-$100/month, re-simulated with numeric impacts (fixed amounts, not scaled to the shortfall)
  - [x] Routes: `GET /recommendations` (baseline) and `recommendations` inside `scenarios/evaluate`
  - [x] UI (what-if panel: baseline suggestion before a run, scenario suggestion after, plus "Explain this result")
- [ ] Add AI-generated plain-language explanations or a conversational coach **if the application AI provider is selected and integration is stable**. Feed it computed facts; never let it invent balances, forecasts, approvals, or eligibility. *(Adapter hook exists, no provider registered yet; blocked on choosing a provider.)*
- [x] Provide a deterministic, non-AI explanation fallback so the demo works without an AI response. *(Done: `explanationService.js` + `POST /explanations`, template used; 3 tests.)*

**Approved extension — Investment Planner (engineering.md section 10):**
- [x] Backend: `routes/investments.routes.js` + `services/investments/` + pure `engine/investments/` (portfolio grouping, CD timeline, hypothetical allocation simulation), in-memory proposed plans and CD decisions (`executed: false`, reset on restart); route + engine tests run without MongoDB.
- [x] Data: CD and brokerage holdings added as `supplemental_synthetic` accounts via `demoData.js` → `normalize.js` (401(k) and cash-flow numbers unchanged; seed dry-run identical).
- [ ] **Run `npm run sync:nessie -- --dry`, then `npm run sync:nessie` against Atlas (needs explicit approval)** so the new holdings exist in MongoDB; then `npm run export:mocks`.
- [x] UI wired to the live investment endpoints (three-page app; merged in `feature/demo-hybrid`).

**Stretch — only after the PNC + Nessie core is fully working:**
- [ ] Add a Toyota scenario type or profile with labeled synthetic vehicle and financing data (this requires updating `engineering.md`, which currently fixes exactly 3 profiles).
- [ ] Compare realistic vehicle choices (e.g., keep current vehicle, pay down loan, refinance, replace) using the existing forecast/what-if engine and explicit assumptions.
- [ ] Show payment/cash-flow trade-offs and an appropriate suggested next step; avoid claims of guaranteed offers or approval.

**Exit gate:** A judge can change a financial assumption, see a numerically consistent before/after comparison, and receive an actionable explanation. Toyota is optional and must not block this gate.

## Phase 5 — Integration & Hardening
- [ ] Run end-to-end flows: select profile → inspect dashboard → view health/forecast → run scenario → read recommendation.
- [ ] Verify data consistency across Nessie import, MongoDB, financial engine, APIs, charts, simulator, and guidance.
- [x] Rate limiting on calculation and explanation routes (`express-rate-limit`; 60/min, 10/min for explanations), live-tested.
- [ ] Audit system-boundary errors: missing data, failed Nessie/API requests, MongoDB disconnection, invalid scenario inputs, and AI timeout/failure. *(Partly: DB errors map to 503 and AI failure falls back to the template, but DB-down behavior has not been exercised; no route-level tests yet.)*
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
  - **Health indicator labels/thresholds (decided):** coverage <1 mo at risk / 1–3 watch / ≥3 on track; burden >36% at risk / 20–36% watch / <20% on track; any day below the floor = at risk. Recorded in `engineering.md` section 4 (rule 6); applied client-side.
  - **Income vs. expenses numbers (decided):** `GET /spending` returns `incomeMonthlyCents`, `expensesMonthlyCents`, `netCashFlowMonthlyCents`; `GET /overview` returns `income[]` (next payday). Definitions in `engineering.md` section 5.
- **If time runs short:** Stop Toyota work first, then optional AI conversation. Preserve the functioning Nessie → dashboard → indicators/forecast → what-if → action demo.
