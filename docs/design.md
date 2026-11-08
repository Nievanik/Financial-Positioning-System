# Design — Frontend Note & Implementation Plan

Source design: `public/index.html` on branch `feature/json` (static HTML/CSS mock, hard-coded figures; its "Northstar" name is replaced by "FPS", see D1).
Target: the React/Vite client on `dev` (`client/`), fed only by the Express API in `engineering.md` section 5.

Rule for this whole document: **copy the friend's look exactly, but every number comes from the backend.** If the design shows a number the API cannot produce, we change the widget (or add a small backend field); we never hard-code or invent the figure.

---

## Part A — Design spec (what we replicate)

### A1. Color tokens

Core tokens (from the design's `:root`):

| Token | Hex | Used for |
|---|---|---|
| `ink` | `#182538` | body text |
| `muted` | `#788496` | secondary text, captions |
| `line` | `#e8ebf0` | borders, dividers |
| `paper` | `#ffffff` | cards, sidebar |
| `bg` | `#f5f6f8` | page background |
| `navy` | `#142b49` | brand mark, active nav text, what-if panel background |
| `teal` | `#168f83` | primary accent, positive values, chart line |
| `teal-pale` | `#e8f5f2` | insight box background |
| `amber` | `#c8872b` | warning accent |
| `amber-pale` | `#fff5e5` | "watch" pill background |
| `red` | `#cc5f5f` | negative values, shortfalls |
| shadow | `0 5px 22px #1b2c4410` | card shadow |

Secondary hex values used directly in the design (keep them as named tokens so they don't scatter):

- Nav: section title `#a1aaba`, link `#6e7a8d`, active bg `#edf2f8`, hover `#f4f6f9`, avatar bg `#e5edf4`
- Stat card: label `#647186`, icon tile bg `#eff3f8`
- Segmented control: text `#79869a`, active bg `#eef2f7`
- Chart: grid `#edf0f3`, axis text `#9aa5b3`, threshold line `#a8bacb` (legend dot `#b6c4d4`)
- Insight: text `#27675e`, heading `#205c54`
- Health: score box bg `#f8fafb`, ring track `#e3ecea`, metric divider `#eff1f4`, pill good `#e8f5f0`/`#23816f`, pill watch `amber-pale`/`#a36a1d`, meter track `#edf0f3`, meter warn `#e3a33e`
- Donut / category palette (in order): `#168f83`, `#4c718f`, `#93aa86`, `#dba54e`, `#b9c4d1` (last = "Other")
- Category list: name `#667387`, value `#344257`
- Table: header `#99a3b1`, row divider `#f0f2f5`, merchant icon tile `#f0f3f7`
- What-if (dark panel): subtitle `#b8c6d6`, input bg `#233d5d` border `#3a5370`, field label `#d3dce6`, slider accent `#4ac0a8`, result box `#203a59` border `#37516d`, result caption `#bdcbd9`/`#cbd6e2`, action button `#36b39d` with text `#102e39`
- Recommendation box: bg `#fffaf1`, border `#f2e8d6`, title `#a67430`, text `#5e533f`
- Footnote `#9aa4b1`

Additions the design lacks but our data needs: a red/"at risk" pill (`#fbeaea` bg / `red` text) and an amber variant of the insight box (`amber-pale` bg / `#a36a1d` text) for shortfall warnings.

### A2. Typography

- Font: Inter (design stack `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`), base `14px/1.5`.
- H1 greeting 27px, letter-spacing −0.7px. Panel H2 15px, −0.2px.
- Stat value 25px, weight ~730, −0.65px. Spend total 22px.
- Eyebrow: 11px, uppercase, 1.1px tracking, weight 750, teal.
- Small text runs 9–12px (captions, table, pills). Weights used: 550 / 600 / 650 / 700 / 730 / 750.

### A3. Shape & spacing

- Radii: card 13px, inner boxes 10–11px, inputs and buttons 8–9px, pills 20px, icon tiles 8–11px.
- Card: white, 1px `line` border, shadow token. Panel padding 20px, stat padding 18/19px.
- Gaps: stat row 15px, panel grids 17px.

### A4. Layout

```
┌────────────┬───────────────────────────────────────────────────────────┐
│ Sidebar    │ Topbar 72px: breadcrumb · profile <select> · (bell)        │
│ 236px      ├───────────────────────────────────────────────────────────┤
│ brand      │ Heading: eyebrow / "Good morning, {name}" / sub · date     │
│ WORKSPACE  │ [Stat][Stat][Stat][Stat]                     4 columns     │
│  Overview  │ [Cash flow forecast ........][Financial health]  1.72 : .9 │
│  Cash flow │ [Spending][Recent transactions][What-if (navy)] 1.05:1.25:.85│
│  Spending  │ footnote                                                   │
│  Txns      │                                                            │
│ YOUR PLAN  │ content max-width 1420px, padding 32px 38px 50px           │
│  Health    │                                                            │
│  What-if   │                                                            │
│ DEMO PROFILE (avatar + name, pinned bottom)                             │
└────────────┴───────────────────────────────────────────────────────────┘
```

Breakpoints:
- **≤1100px:** stats 2×2; lower grid 2 columns; what-if spans full width with its fields in 2 columns.
- **≤760px:** sidebar hidden, ☰ shown in topbar; topbar 60px; everything single column; hide the date and the table's Account column; chart 220px.
- **≤430px:** tighter stat cards (value 20px), donut 100px, content side padding 12px.

### A5. Components in the design

1. **Sidebar:** brand mark (navy rounded square + "N"), nav groups with a glyph icon and active state, demo profile card at the bottom.
2. **Topbar:** breadcrumb "Workspace / Overview", profile dropdown, notification icon button.
3. **Heading:** eyebrow, greeting, subtitle, "Updated … · Demo data".
4. **Stat cards ×4:** label + icon tile, big value, footer line.
5. **Cash flow forecast:** area line chart with a gradient fill, dashed low-balance threshold, 1M/3M/6M segmented control, legend, teal insight box.
6. **Financial health:** score ring + label, then 3 metrics, each with a name, status pill, one-line explanation, and a meter.
7. **Spending breakdown:** total, comparison line, donut with center label, category list with swatches.
8. **Recent transactions:** table with Merchant (icon tile) / Account / Amount; income shown in teal with "+".
9. **What-if (navy card):** decision type select, amount slider with live value, horizon select, result box, "Compare with forecast →" button, amber recommendation box.
10. **Footnote:** demo-data disclaimer.

---

## Part B — Mapping design ↔ backend (alignment)

Endpoints are under `/api/v1`, and every amount is in integer cents (format with `Intl.NumberFormat` only at render time). Profile = `slug`.

| Design element | Backend source | Notes / change from design |
|---|---|---|
| Profile dropdown + sidebar card | `GET /profiles` → `profiles[].{slug, displayName}` | Avatar = initials of `displayName`. Three real profiles (Sam Okafor, Jordan Rivera, Maya Chen) replace the design's fake names. |
| Greeting "Good morning, Jordan" | `overview.profile.displayName` (first name) | Greeting depends on the viewer's local time. |
| "Updated just now · Demo data" | `overview.profile.lastSyncedAt`, `overview.asOf` | e.g. "Data as of Nov 8, 2026 · Synthetic demo data". |
| **Available cash** stat | `overview.cash.availableCents` | Design footer "↑4.2% from last month" has **no backend source** → show "Checking $X · Savings $Y". |
| **Monthly income** stat + "Next payday" | **GAP:** no endpoint returns income or the next pay date (`overview.obligations` holds outflows only). | Needs backend step B0. |
| **Monthly spending** stat | `GET /spending?months=1` → `totalCents` | Footer "vs. monthly average" = compare against `GET /spending?months=3` `totalCents / 3`. Window is "last 30 days", not the calendar month, so we label it that way. |
| **Bills coming up** stat | `overview.obligations` where `nextDate ≤ asOf + 14d` | Sum + count ("Next 14 days · N payments"). |
| Cash flow chart | `GET /forecast` → `daily[]` (~174 days), `checkpoints[]` (months 1/2/3/6) | Segmented control becomes **1M / 2M / 3M / 6M** to match the API's checkpoints; we slice `daily` up to the checkpoint date. Render with Recharts (techstack). |
| Low-balance threshold line | `forecast.assumptions.cashFloorCents` | A horizontal reference line at the floor, **not** the design's shifted copy of the curve. |
| Shortfall warning | `forecast.shortfalls[]` (date, cashCents) | Shade the area below the floor in red and mark the first shortfall date. |
| Insight box ("Looking steady") | `POST /explanations {subject:'forecast'}` → `{text, method}` | Teal when there are no shortfalls, amber variant when there are. The text is backend-computed (template or AI), never written on the client. Rate limit is 10/min, so fetch once per profile. |
| Health score ring "78" | **No composite score exists.** | Ring shows **"N of 3 healthy"** (fill = N/3). Inventing a score would break the "never invent financial outputs" rule. |
| Emergency savings metric | `GET /health-metrics` → `indicators.emergencyCoverage.months` (can be `null`) | Copy: "X.X months of essential expenses covered". Meter = months/6, capped at 100%. |
| Debt payment burden metric | `indicators.debtPaymentBurden.ratio` (can be `null`) | "X% of monthly income goes to debt payments". Meter = 1 − ratio/0.5. |
| Cash-flow safety metric | `indicators.cashFlowSafety.{minCashCents, daysBelowFloor}` | "Lowest projected balance $X · N days below floor". |
| Pills (On track / Keep an eye on it / At risk) | **Thresholds not decided yet** (phases.md "open" item) | Proposed defaults, decision D2. |
| "Based on 3 simple indicators" + calculation details | `health-metrics.assumptions` | Expandable "How we calculate this" (required by Phase 3). |
| Spending donut + list | `GET /spending?months=1` → `byCategory[]` (sorted desc) | Top 4 categories + "Other" (sum of the rest), using the design's 5-color palette. Category names come from the backend enum (`groceries`, `housing`, …) and are title-cased on the client. |
| "$280 less than usual" | `spending?months=1` vs `months=3` average | Same comparison the stat card uses. |
| Recent transactions | `GET /transactions?limit=…` → `items[]` | Merchant = `merchantName \|\| description`; Account = look up `accountId` in `overview.accounts[].name`; Amount = `+` and teal when `cashflowKind === 'income'`, otherwise `−amountCents`. Credit-card purchases have `cashImpactCents = 0`, so display `amountCents` and use the account name to show it's on the card. Icon = lucide icon per `category`. |
| "View all →" | same endpoint, `limit` up to 100, optional `category` filter | Expands into a full list with a category filter. |
| What-if: Decision type | `POST /scenarios/evaluate`, `type` ∈ `one_time`, `down_payment_recurring`, `monthly_spending_reduction` | Design has 2 types; the backend supports 3 → options: "One-time purchase", "Financed purchase (down payment + monthly)", "Cut monthly spending". |
| What-if: amount slider | `amountCents` / `downPaymentCents` / `monthlyAmountCents` (positive integers) | Down-payment type shows two sliders. |
| What-if: "Time horizon 3/6/12 mo" | `durationMonths` 1–6 (recurring types only) + required `startDate` > `asOf` | 12 months isn't supported → "Duration 1–6 months". Add a start-month picker (default: first day of next month). |
| Result box "Estimated cash in N months" | response `scenario.checkpoints[]`, `deltas.month{1,2,3,6}Cents` | Checkpoint chips 1/2/3/6 months; show the delta vs. baseline. |
| Risk | `assessment.{riskLevel: 'ok'|'shortfall', firstShortfallDate, reasons[]}` | Pill + reason text. |
| "Compare with forecast →" | response `scenario.daily[]` | Draws the scenario as a dashed overlay on the forecast chart and scrolls to it (the design only scrolled). |
| "A thought to consider" | scenario `recommendations[0]`; before any run, `GET /recommendations` | Title, action, and impact (`impactMonth6Cents`, `impactMinimumCashCents`). Optional "Explain" → `POST /explanations {subject:'scenario', scenario}`. |
| Notification bell | none | **Dropped** (no backend concept). |
| Footnote | static | "Synthetic demo data · Not connected to a live financial account · Estimates, not financial advice." |

### Required by Phase 3 but missing from the design

The design was a visual concept; `phases.md` Phase 3 needs more. These panels are added **in the same visual language** (white card, 15px H2, 11px muted subtitle, same table/pill styles):

1. **Balances & net worth panel:** `overview.totals` + `overview.accounts` + `overview.loans`. Shows cash vs. savings vs. retirement/investments vs. credit-card debt vs. loans, credit usage (`creditCardDebtCents / creditLimitCents` as a meter), and net worth, kept as separate figures. Sidebar "Overview" anchor.
2. **Upcoming payments list:** `overview.obligations` (name, kind pill, date, amount). This also backs the "Bills coming up" card.
3. **Income vs. expenses:** needs B0. Shown inside the Monthly income card footer or as a small row in the spending panel.

Placement: a new row between the forecast/health row and the spending row, `[Balances (1.72fr)] [Upcoming payments (.9fr)]`, reusing the `grid-main` proportions.

### Cross-cutting behavior

- **Loading:** a skeleton block per card (same size as the card) so the layout doesn't jump.
- **Error:** an inline message inside the failing card with Retry. One failing endpoint must not blank the whole page. A network error (`ApiError.code === 'NETWORK_ERROR'`) shows one banner.
- **Empty:** e.g. "No transactions in this window."
- **Profile switch:** abort in-flight requests (the existing `api()` takes `signal`), clear any what-if result, keep the forecast range. Selected profile lives in the URL `?profile=slug` so a judge can share or reload the link.
- **Rate limits:** `429` shows "Too many requests, try again in a minute". The what-if panel evaluates on button click, not on every slider tick.
- **Accessibility:** charts get `aria-label` summaries plus a visually hidden table of checkpoints; pills use text, not color alone; keyboard-reachable nav; visible focus ring (teal).

---

## Part C — Technical approach

- Keep the `dev` client stack: React 19 + Vite + Tailwind v4 + shadcn (`components.json`), `lucide-react` icons, Recharts, native `fetch` via `src/lib/api.js`. No new state library; `useState`/`useEffect` + one small `useApi` hook.
- **Tokens:** put Part A1 into `src/index.css` as `@theme` colors (`--color-ink`, `--color-navy`, `--color-teal`, …) and point the shadcn variables at them (`--background`→bg, `--primary`→navy, `--border`→line, `--ring`→teal, `--chart-1..5`→donut palette). Components then use Tailwind classes such as `bg-navy text-teal border-line`.
- **Font:** replace Geist with Inter (`@fontsource-variable/inter`) to match the design.
- **Single page with anchors** (`#overview`, `#forecast`, `#spending`, `#transactions`, `#health`, `#scenario`), exactly like the design. `react-router-dom` is installed but not needed yet.
- **Mock mode (optional):** `VITE_USE_MOCKS=true` makes `api()` read `src/mocks/{slug}/*.json` (already exported) so UI work doesn't need MongoDB running.

File layout:

```
client/src/
  App.jsx                    shell + selected profile (URL param)
  index.css                  tokens
  lib/api.js                 (exists) + optional mock mode
  lib/format.js              money(cents), date, initials, titleCase
  lib/health.js              indicator → {label, tone, meter%}
  hooks/useApi.js            fetch + abort + {data, error, loading, retry}
  components/layout/         Sidebar, Topbar, PageHeading, Panel (card shell), Pill, Meter, Skeleton
  components/dashboard/      StatCards, ForecastPanel, HealthPanel, BalancesPanel,
                             UpcomingPanel, SpendingPanel, TransactionsPanel, WhatIfPanel
```

---

## Part D — Implementation plan (one step at a time)

Branch: `feature/frontend` (from `dev`). Each step ends with `npm run build` + `npm run lint` + `npm test` (pure helpers in `src/lib`, Node's built-in runner) in `client/`, a visual check against the design at 1440 / 1100 / 760 / 390px, and a ticked box below.

- [x] **B0 — Backend gap (small, do first or alongside step 2).** Add income data. Proposal: `GET /overview` gains `income: [{ name, amountCents, frequency, nextDate }]` from active income flows; `GET /spending` gains `incomeMonthlyCents`, `expensesMonthlyCents`, `netCashFlowMonthlyCents`. Update `engineering.md` §5 first, add a test, then re-export mocks.
- [x] **Step 1 — Foundation & shell.** Tokens + Inter in `index.css` (Tailwind breakpoints remapped to the design: `sm` 431, `md` 761, `lg` 1101); `format.js`, `useApi`, Panel/Skeleton/ErrorNote primitives (Pill/Meter come with step 4); Sidebar, Topbar, heading; profile selector from `GET /profiles` with `?profile=`; responsive grid skeleton with empty panels; footnote; mobile ☰ opens the sidebar as a drawer; optional mock mode.
- [x] **Step 2 — Overview numbers.** Four stat cards (cash, income [needs B0], spending vs. average, bills in 14 days) + Balances & net worth panel + Upcoming payments list.
- [x] **Step 3 — Cash flow forecast.** Recharts area chart (gradient fill, teal line, month ticks, $k axis), 1M/2M/3M/6M, floor reference line, shortfall shading + first-shortfall marker, legend, insight box from `/explanations`, accessible checkpoint table.
- [x] **Step 4 — Financial health.** `lib/health.js` thresholds (D2), ring "N of 3 healthy", 3 metrics with pills/meters/plain-language text, null handling, "How we calculate this" with assumptions.
- [x] **Step 5 — Spending & transactions.** Donut (CSS conic-gradient like the design, top 4 + Other) with center total and comparison line; transactions table with account names, category icons, signed amounts, "View all" + category filter.
- [x] **Step 6 — What-if planner.** Navy panel with 3 scenario types, sliders, duration, start month; `POST /scenarios/evaluate` on click; result box with 1/2/3/6 chips and deltas; risk pill; recommendation box (baseline recs before any run); scenario overlay on the forecast chart; 422/429 messages; optional "Explain" button.
- [ ] **Step 7 — Polish & hardening.** Breakpoint pass, keyboard/focus/aria check, profile-switch race check, synthetic-data labels everywhere, remove the old API-status `App.jsx` content, update `phases.md` Phase 3/4 boxes and `CLAUDE.md` status.

### Decisions needed (defaults used unless changed)

- **D1 Product name — decided:** "FPS" (brand mark "F", page title "FPS — Financial overview"), not the design's "Northstar".
- **D2 Health thresholds — decided:** the defaults below, recorded in `engineering.md` §4 rule 6: coverage <1 mo at risk / 1–3 watch / ≥3 on track; burden >36% at risk / 20–36% watch / <20% on track; any day below floor = at risk.
- **D3 Income figures — done (B0):** `overview.income[]` + `spending.incomeMonthlyCents/expensesMonthlyCents/netCashFlowMonthlyCents`; definitions in `engineering.md` §5.
- **D4 Health ring — done:** "N/3" indicators on track (no invented score).
