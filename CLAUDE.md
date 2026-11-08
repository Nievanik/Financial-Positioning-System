# FPS — Financial Positioning System (HackUTD 2026)

3-developer hackathon project: PNC "360° Financial Health Navigator" + Capital One Nessie (synthetic data). Toyota is a later stretch, never before the PNC + Nessie MVP works end to end.

This file is a router, not a spec. Put detail in `docs/`, not here.

## Read Order (stop once your task is covered)
1. `docs/phases.md` — build order; read first for "what's next" (recommend one small step).
2. `docs/requirements.md` — product scope. Read before a new feature.
3. `docs/engineering.md` — schema, API routes, financial-engine rules, tests. **Wins on any technical conflict.** Read before any DB query, route, or engine function.
4. `docs/techstack.md` — dependencies. Read before adding a library.
5. `docs/design.md` — UI (not written yet). Frontend work only.

## Keep Docs in Sync (mid-task, not at the end)
- Schema, API, or engine rule changes → update `engineering.md` **before** the code.
- Scope change → `requirements.md`. New library → `techstack.md`. Phase done/reordered → `phases.md`.
- **After every completed task, update `phases.md` (tick the checklist item, note anything reordered or newly discovered) before reporting done.**
- A stale doc is a bug.

## Settled Decisions (don't reopen)
- React + Vite + **JavaScript** (no TypeScript/Next.js); Tailwind + shadcn/ui; Recharts; Express + Node (ES modules); MongoDB Atlas + Mongoose; native `fetch`; Render; one monorepo (`client/`, `server/`).
- **Exactly 3** read-only fictional demo profiles; no login, no editing. URL `:slug` is the profile slug.
- **Deterministic daily cash-flow forecast** (month-end checkpoints 1/2/3/6 + daily shortfall detection). No Monte Carlo, no AI-generated numbers.
- What-if scenarios are **stateless** (no `scenarios` collection). In-app AI provider is **undecided**: provider-neutral adapter + template fallback.
- Superseded, don't bring back: Next.js, TypeScript, PostgreSQL, Prisma, Tiger Data, Vultr, Solana, GoDaddy, Gemini-as-chosen.

## Invariants
- Money is integer cents. Available cash = checking + savings only; retirement/CDs/credit limits are never cash.
- No double-counting: transfers, card purchase vs. payment, loan payment (once, in `recurringCashFlows`).
- Secrets are server-only (never `VITE_`); never touch `.env` or commit secrets.
- Financial math lives in pure functions in `server/src/engine/`, tested without Express/Mongo.
- All data is synthetic and labeled; forecasts are estimates, not loan approval or advice.
- Don't invent product behavior missing from the docs — resolve it in the doc first.

## Commands
| Purpose | Command |
|---|---|
| Client dev / build / lint | `cd client && npm run dev` / `npm run build` / `npm run lint` |
| Server dev / start | `cd server && npm run dev` / `npm start` |
| Tests | `cd server && npm test` |
| Data (server) | `npm run seed` (dry-run; `-- --post` is permanent, already done, do not re-run) / `npm run sync:nessie` (`-- --dry` to check) / `npm run export:mocks` |

## Git
`main` stable <- `dev` integration <- `feature/*` branches via PR. No destructive DB commands without confirmation.

## Status
Backend MVP is built and locally verified (engine, models, Nessie client, seed/sync scripts, API routes, rate limiting; `npm test` in `server/`); frontend is still the scaffold plus mock JSON in `client/src/mocks/`, blocked on `design.md`. Nothing here is deployed. `phases.md` has the exact state; check the repo before claiming anything is implemented.

## Before Calling Anything Done
Works end to end within scope, no invariant violated, engine logic has a passing test, build passes, affected docs updated, `phases.md` updated.

## Learned Rules
When the user corrects you or you hit a bug from a wrong assumption, append a rule here: `N. [CATEGORY] Never/Always X — because Y.` Never delete; supersede with a newer rule (newer wins).

1. [STYLE] Never write unlayered global resets (like `*`) in `client/src/index.css` — Tailwind v4 uses cascade layers, and unlayered styles override utilities regardless of specificity.
