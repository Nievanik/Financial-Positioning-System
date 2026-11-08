# FPS — Financial Positioning System (HackUTD 2026)

3-developer hackathon project: PNC "360° Financial Health Navigator" + Capital One Nessie (synthetic data). Toyota is a later stretch, never before the PNC + Nessie MVP works end to end.

## Source of truth (all in `docs/`, lowercase)
- `engineering.md` — schema, API routes, financial-engine rules, tests. **Wins on any technical conflict.** Change it before changing code.
- `requirements.md` product scope · `techstack.md` dependencies · `phases.md` build order · `design.md` UI (not written yet).

## Settled decisions (don't reopen)
- React + Vite + **JavaScript** (no TypeScript/Next.js); Tailwind + shadcn/ui; Recharts; Express + Node (ES modules); MongoDB Atlas + Mongoose; native `fetch`; Render; one monorepo (`client/`, `server/`).
- **Exactly 3** read-only fictional demo profiles; no login, no editing. URL `:slug` is the profile slug.
- **Deterministic daily cash-flow forecast** (month-end checkpoints 1/2/3/6 + daily shortfall detection). No Monte Carlo, no AI-generated numbers.
- What-if scenarios are **stateless** (no `scenarios` collection). In-app AI provider is **undecided**: provider-neutral adapter + template fallback.
- Superseded, don't bring back: Next.js, TypeScript, PostgreSQL, Prisma, Tiger Data, Vultr, Solana, GoDaddy, Gemini-as-chosen.

## Invariants
- Money is integer cents. Available cash = checking + savings only; retirement/CDs/credit limits are never cash.
- No double-counting: transfers, card purchase vs. payment, loan payment (once, in `recurringCashFlows`).
- Secrets are server-only (never `VITE_`). Financial math lives in pure functions in `server/src/engine/`, tested without Express/Mongo.
- All data is synthetic and labeled; forecasts are estimates, not loan approval or advice.

## Git
`main` stable <- `dev` integration <- `feature/*` branches via PR.

## Status
Docs only; no code scaffolded yet. Check the repo before claiming anything is implemented. For "what's next", read `phases.md` and recommend one small step.
