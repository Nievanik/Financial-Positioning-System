# Financial Positioning System — UI/UX Design Specification

**Version:** HackUTD MVP | **Implementation:** React + Vite (JavaScript), Recharts, Tailwind CSS and optionally shadcn/ui  
**Status:** Implementation-ready design guidance  
**Reference:** Chase public banking site and publicly described account dashboard patterns; original product design, not a reproduction of Chase's interface.

## 1. Design intent

Build a trustworthy, polished consumer-finance dashboard with the usability of a modern bank. Borrow *general interaction patterns* from major banking websites: prominent balances, clear account grouping, straightforward navigation, concise explanations, and easy access to details. Do **not** use Chase's logo, copyrighted illustrations, marketing copy, proprietary screenshots, or imply affiliation. Our product identity is **Financial Positioning System** (short display name **FinPilot**, if the team agrees).

The product is not a bank. All sample accounts are synthetic, forecasts are estimates, and investment scenarios are hypothetical. Clearly distinguish available cash from investment balances, credit limits, and liabilities.

### Core experience

**Understand → Forecast → Simulate → Plan → Review.** A user selects a seeded profile, sees their financial position at a glance, understands risks, tests a cash-flow scenario, and explores a proposed investment allocation. A proposed plan must never imply that a real transfer or trade occurred.

## 2. Visual direction

**Mood:** Calm, credible, premium, uncluttered, data-rich but readable. Banking-style restraint rather than flashy fintech gradients.

### Color tokens

Use semantic CSS variables or Tailwind theme tokens; avoid scattering literal colors through components.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#0757A6` | Primary buttons, active navigation, interactive links |
| `--color-primary-hover` | `#064683` | Hover state |
| `--color-primary-subtle` | `#EAF3FC` | Selected filters and soft blue highlights |
| `--color-page` | `#F5F7FA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, navigation |
| `--color-text` | `#172B4D` | Headings, important amounts |
| `--color-muted` | `#64748B` | Supporting labels and metadata |
| `--color-border` | `#E1E7EF` | Dividers, card outlines |
| `--color-success` | `#177A52` | Healthy metrics, positive cash flow |
| `--color-warning` | `#A66309` | Caution, upcoming obligations |
| `--color-danger` | `#BE3342` | Cash shortfalls, high debt burden |
| `--color-chart-1` | `#1769AA` | First chart series |
| `--color-chart-2` | `#25A18E` | Second chart series |
| `--color-chart-3` | `#E4A33B` | Third chart series |
| `--color-chart-4` | `#8866BB` | Fourth chart series |

These are original suggested tokens, not a claim of exact Chase brand values. Use an accessible palette with sufficient contrast, and never communicate a warning through color alone.

### Typography

Use `Inter` if already available, otherwise a system sans stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif). No special font download required. Main heading 28–32 px, section heading 20–22 px, card title 15–17 px, body 14–16 px, metadata 12–13 px. Currency values should use tabular numerals. Prefer sentence case. Avoid ALL CAPS for full headings.

### Layout and spacing

- Desktop: fixed or sticky left sidebar 232–256 px; top header 64–72 px; content max width ~1440 px with 24–32 px padding.
- Tablet: collapsible sidebar, 16–24 px content padding.
- Mobile: sidebar becomes a drawer; single-column cards; horizontal chart scrolling only when necessary.
- Use a consistent 8 px spacing scale; card padding 20–24 px; card radius 12–16 px; subtle border and minimal shadow.
- Content grid: 12 columns on desktop; summary cards in groups of 3 or 4; primary chart 8 columns and related insight panel 4 columns where appropriate.
- Avoid dense walls of text, large hero images, excessive gradients, and fake decorative financial numbers.

## 3. Shared app shell

### Header

Left: product mark (simple original geometric icon) and `Financial Positioning System` or approved team product name. Right: **Demo profile selector**, snapshot `asOf` date, optional help/info icon. Do not add login/authentication, real bank branding, or functional money-transfer buttons.

### Sidebar navigation

1. **Dashboard** — `/p/:slug`
2. **Cash-Flow Simulator** — `/p/:slug/simulate`
3. **Investment Planner** — `/p/:slug/investments` (team-approved extension)

Use Lucide icons (e.g., `layout-dashboard`, `chart-no-axes-combined`, `chart-pie`). Active page has a subtle blue background and strong text. Footer of sidebar: `Demo environment • Synthetic data`.

### Profile switching

Select one of the three seeded profiles. Switching profiles updates the URL slug and resets scenario inputs, selected chart segments, open explanations, and unsaved proposed plans. Show skeletons while fetching. Unknown slugs display a clear not-found state with a route back to a valid profile.

### Global disclaimer

A visible, understated notice on each page: **“Demo uses synthetic financial data. Forecasts and investment scenarios are estimates for illustration only, not financial advice. No real transactions occur.”**

## 4. Dashboard page (`Dashboard.jsx`)

### Information hierarchy

**Top row:** Breadcrumb `Overview / [Profile name]`, heading `Your financial picture`, small subheading `As of [asOf] • Synced from Nessie [lastSyncedAt]` when timestamps exist.

**Summary strip:**

- **Available cash** — checking + savings only, as provided by backend; primary number.
- **Investments & retirement** — clearly separate from cash; includes CDs with accessibility restrictions.
- **Credit-card debt** — outstanding balance, limit, utilization (do not treat credit limit as an asset).
- **Loans & obligations** — outstanding loan amount and nearest known upcoming obligation.

**Main account area:** grouped account cards/lists with clear account type, masked identifier when available, balance, source badge for `supplemental_synthetic`, and click-to-expand details. Use chevrons and a visible selected state. Show CD maturity dates and restrictions when provided.

**Financial health row:** three equal cards:

1. Emergency coverage in months; may be `null` → show `Not available` rather than `0`.
2. Estimated debt-payment burden ratio; may be `null`; explicitly label **Estimate**.
3. Cash-flow safety: minimum daily cash, number of days below cash floor; use warning state for any shortfall.

Each card has a plain-language description, a small assumptions disclosure, and a status label (not just a color).

**Cash forecast:** prominent Recharts line/area chart. Horizontal axis uses real calendar dates. Four month-end checkpoints with date labels and hover details. Mark intra-month shortfall days distinctly even if the month-end balance is positive. Add a compact adjacent `Upcoming obligations / Cash risk` panel.

**Spending:** category breakdown (donut or horizontal bars), total spending, fixed vs. variable split, and the required note: **“Variable spending is modeled as evenly distributed by week.”**

**Recent activity:** responsive transaction table with date, merchant/description, category, account, and amount. Support loading, empty, and error states.

**Recommendations:** concise action cards with numerical impact provided by the server; show source/assumption and a clear `Explain` affordance. Label explanation origin `AI-generated` or `Template-based` according to response data.

### Dashboard wireframe

```text
┌──────────────────────┬────────────────────────────────────────────────────────────────────┐
│ PRODUCT              │ Financial picture                 [Demo profile ▼]  As of Nov 7    │
│                      ├────────────────────────────────────────────────────────────────────┤
│ ● Dashboard          │ Your financial picture                                           │
│   Cash-flow simulator│ Synthetic-data / sync notice                                     │
│   Investment planner │                                                                    │
│                      │ [Available cash] [Investments] [Credit debt] [Loans/obligations]  │
│                      │                                                                    │
│                      │ [Accounts and balances ..............................] [Upcoming] │
│                      │                                                                    │
│                      │ [Emergency coverage] [Debt burden] [Cash-flow safety]            │
│                      │                                                                    │
│                      │ [Daily cash forecast (8 cols) ................] [Shortfall (4)]   │
│                      │                                                                    │
│                      │ [Spending categories] [Fixed vs variable]                        │
│                      │ [Recent transactions ..........................................]  │
│                      │ [Recommended next actions .....................................]  │
└──────────────────────┴────────────────────────────────────────────────────────────────────┘
```

## 5. Cash-Flow Simulator page (`Simulator.jsx`)

### Page composition

Header: `Test a financial decision` with subtext `See how a hypothetical decision changes your projected cash position.`

Desktop two-column layout: left scenario form (about 4 columns), right results (about 8 columns). Mobile stacks form above results.

**Scenario type tabs:** `One-time purchase`, `Down payment + monthly`, `Reduce monthly spending`. Match backend types exactly: `one_time`, `down_payment_recurring`, `monthly_spending_reduction`.

Form fields match `engineering.md` contracts (name, amount cents via parsed currency input, start date, duration, category as applicable). Validate dates against backend-provided `asOf` and horizon; surface 422 validation errors inline. Do not calculate backend-owned metrics in React.

**Results:** baseline vs scenario line chart, four dated month-end checkpoints with numeric deltas, risk level, first shortfall date, shortfall-day warnings, and recommendation cards. Clearly mark when a scenario is illustrative or sourced from mock data. Provide `Reset scenario`.

**Loading and failure:** disable evaluate button while pending; use skeleton/placeholder chart, actionable error with retry, and no silent fallbacks from a failed live API to misleading mock data.

## 6. Investment Planner page (`InvestmentPlanner.jsx`)

This is a **team-approved extension**. Do not confuse it with the existing backend cash-flow simulator. Preserve the original cash-flow API and its semantics.

### Portfolio overview

- Header `Explore your investment mix` with `Hypothetical planning` badge.
- Large interactive Recharts donut chart showing investment categories (brokerage, retirement, CDs, and other categories if actually present). Center label: `Investment portfolio` and a backend-provided or explicitly synthetic total.
- Click a segment to open/update an adjacent account detail panel listing accounts, balances, category, risk explanation, accessibility/withdrawal restrictions, and maturity dates where applicable.
- Do not mix checking/savings cash into the investment donut; do not suggest retirement or CD funds are immediately transferable.
- Use distinct segment colors plus text legend and accessible buttons for keyboard selection.

### What-if allocation

- Sliders or numeric inputs for target allocation percentages. Sum must always be exactly 100%. Display `Current` vs `Proposed` allocations side-by-side.
- Show the difference in percentages and estimated risk/outcome under explicitly labeled assumptions. Prefer results from an investment simulation endpoint. If no endpoint exists yet, use **clearly labeled precomputed synthetic example outcomes** rather than pretending to calculate validated projections.
- Explain market risk, liquidity, taxes, fees, CD early-withdrawal penalties, and retirement-account restrictions as relevant, without giving personalized investment advice.
- CTA `Save as proposed plan` stores a proposal in React state or backend demo storage; status `Draft / Awaiting approval / Approved in demo / Rejected in demo`.

### CD maturity timeline and approval

- Timeline of synthetic CD maturity events, sorted by date.
- Each item: account nickname, principal, maturity date, assumed interest if provided, and available decision options.
- `Review proposed action` opens a confirmation dialog that summarizes the proposed change and explicitly asks `Approve demo plan` or `Reject`.
- **No real trades, transfers, emails, scheduled notifications, or auto-execution.** If there is no scheduler, use a clearly labeled `Simulate maturity event` control to demonstrate the approval interaction. Do not claim an actual reminder was sent.

### Investment page wireframe

```text
[Explore your investment mix]                [Hypothetical planning]
[Interactive portfolio donut (7 cols)]       [Selected account details (5 cols)]
[Current allocation]                         [Proposed allocation sliders]
[Illustrative outcomes and risk assumptions ............................]
[Save as proposed plan]  [Review plan]
[CD maturity timeline ...................................................]
[Explicit approval/rejection demo dialog]
```

## 7. Components and code ownership

Use the documented monorepo paths. Suggested component structure:

```text
client/src/
  pages/Dashboard.jsx
  pages/Simulator.jsx
  pages/InvestmentPlanner.jsx
  components/layout/AppShell.jsx
  components/layout/ProfileSwitcher.jsx
  components/layout/DisclaimerBanner.jsx
  components/financial/AccountCard.jsx
  components/financial/IndicatorCard.jsx
  components/financial/SyntheticBadge.jsx
  components/charts/ForecastChart.jsx
  components/charts/SpendingByCategoryChart.jsx
  components/charts/PortfolioChart.jsx
  features/scenarios/ScenarioForm.jsx
  features/scenarios/ScenarioResults.jsx
  features/investments/AllocationSimulator.jsx
  features/investments/MaturityTimeline.jsx
  features/investments/PlanReviewDialog.jsx
  lib/api.js
  lib/money.js
  lib/dates.js
```

Prefer existing components and patterns rather than generating duplicate files. Do not change server contracts without coordination. The frontend formats money and dates; server-owned financial calculations remain server-side.

## 8. Interaction and accessibility requirements

- All buttons, tabs, dialogs, sliders, and chart selectors must be keyboard accessible.
- Visible focus rings, meaningful labels, `aria-live` for results/status where appropriate.
- At least 44 px touch targets for important controls on mobile.
- Chart insights must also be available as text/tables for users who cannot interpret visual charts.
- Format currency with `Intl.NumberFormat`, using cents as supplied by API.
- Treat `YYYY-MM-DD` as a calendar date, not an unqualified UTC date converted to local time.
- No misleading green-only success state, and no invented live-sync timestamps.
- Profile switching resets all in-memory scenario and proposed-plan state.
- Display clear loading, empty, offline/error, and invalid-input states in every major section.

## 9. Data and integration rules

- `docs/engineering.md` remains authoritative for backend contracts and route names.
- Use `/api/v1` endpoints through `client/src/lib/api.js`; do not hard-code fetches across components.
- `VITE_API_BASE_URL` is the API origin, with `/api/v1` appended in the wrapper if the team adopts that convention.
- Mock fixtures must be explicitly labeled and centralized. Do not silently substitute mock results after a failed live request.
- `source: "supplemental_synthetic"` must display a source badge on the affected record.
- Never sum credit limits into available cash or investment/retirement balances into spendable cash.
- Keep financial math (forecast, scenario evaluation, investment outcome calculations) on the backend; presentation-only percentage allocations can be managed in React.
- No login, no actual transfers, no real investment orders, no persistent sensitive personal financial data.

## 10. Demo priorities (deadline-driven)

**P0 — must work:** Shell, three-profile selector, overview cards, health indicators, cash forecast with shortfalls, scenario evaluation, clear disclaimers, responsive layout, and working navigation.

**P1 — strong demo differentiator:** Interactive investment donut + account drilldown, allocation sliders, investment assumptions, proposal save/review, CD maturity timeline.

**P2 — only after P0/P1:** Micro-animations, extra filtering, advanced hover polish, persistent demo plan storage, optional explanation panel refinements.

No page should show the stock Vite starter template. Test desktop at 1440 px and mobile at ~390 px. Run `npm run build` from `client/` and verify no runtime errors in the browser console.

## 11. Acceptance checklist

- [ ] Professional, original bank-inspired interface; no Chase logos or proprietary assets.
- [ ] Header, sidebar, profile selector, and routes work on all pages.
- [ ] Cash, investments, debts, and obligations are financially distinct.
- [ ] Three indicators explain their values and assumptions, including null states.
- [ ] Forecast shows actual month-end dates and intramonth shortfalls.
- [ ] All three cash-flow scenario forms match backend request shapes.
- [ ] Investment donut is clickable and shows actual matching account details.
- [ ] Allocation controls total 100% and show hypothetical outcomes transparently.
- [ ] CD maturity approval is explicitly a simulation with no execution.
- [ ] Synthetic data, sync timestamps, and AI/template explanations are honestly labeled.
- [ ] Loading, error, and empty states are implemented.
- [ ] Responsive, accessible, and build succeeds.

## 12. Public design references

- Chase personal home: https://www.chase.com/personal/home — general financial navigation and clear product grouping.
- Chase mobile money management overview: https://www.chase.com/personal/banking/education/basics/money-management-tips — balances, spending categories, cash-flow overview, account access.
- Chase account dashboard redesign announcement: https://media.chase.com/news/banking-on-the-new-chase-com-is-even-better — account snapshot, tile drilldowns, persistent side navigation.
- Chase online banking overview: https://www.chase.com/digital/online-banking — account activity, balances, and transfer review interaction patterns.

**Reference limitation:** Public pages and product descriptions were reviewed, not a signed-in private Chase account. This document defines an original design based on publicly described patterns, not a pixel-perfect copy of Chase's authenticated UI.
