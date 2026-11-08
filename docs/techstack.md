# FPS — Tech Stack

**Project:** Financial Positioning System (FPS) · HackUTD 2026  
**Status:** Stack confirmed, except for the explicitly deferred decisions below  
**Team:** 3 developers

## Confirmed technologies

| Area | Choice | Role |
| --- | --- | --- |
| Frontend | **React + Vite + JavaScript** | Single-page financial dashboard and interactive scenarios |
| Styling | **Tailwind CSS + shadcn/ui** | Reusable responsive UI components |
| Charts | **Recharts** | Spending, balance forecasts, and scenario comparisons |
| Backend | **Node.js + Express.js** | REST APIs, data processing, and integrations |
| Backend language | **JavaScript** | Server-side application code |
| Database | **MongoDB Atlas** | Single persistent database for demo financial data and scenarios |
| Data models | **Mongoose** | Schema definitions and MongoDB access |
| Banking data | **Capital One Nessie API** | Source of synthetic banking data |
| Data integration | **Import to MongoDB, refresh as needed** | Normalize and persist Nessie records for application queries |
| API communication | **Native `fetch` + REST/JSON** | Browser-to-Express communication |
| Repository | **One GitHub repository: `client/` + `server/`** | Shared codebase for the three developers |
| Deployment | **Render Static Site + Render Web Service** | Separate hosting for frontend and Express backend |
| Development assistants | **Claude + Codex** | Help build, review, debug, and document the project |
| Demo access | **Selectable synthetic profiles; no login** | Keep demo friction low; no authentication system |

## Decisions intentionally deferred

| Area | Status | Notes |
| --- | --- | --- |
| In-app AI API provider | **Decide later** | Claude/Codex are coding assistants; no runtime AI vendor is committed |
| Testing framework/tools | **Decide later** (pick `node:test` or Vitest at scaffold time) | Numerical accuracy and reproducible demo checks remain essential |

Forecasting is **decided** (deterministic daily cash-flow projection; see `engineering.md`). Do not silently substitute a vendor or a methodology for any deferred item.

## Architecture

```text
Browser
  └── React + Vite (JavaScript)
        ├── Tailwind CSS + shadcn/ui
        ├── Recharts
        └── fetch (REST/JSON)
              │
              ▼
         Express.js API (Node.js, JavaScript)
           ├── Financial overview, spending, health metrics
           ├── Forecast + what-if endpoints (implementation TBD)
           ├── AI explanation endpoint (provider TBD)
           ├── Nessie data importer / refresh service
           │     └── Capital One Nessie API (synthetic)
           └── Mongoose
                 └── MongoDB Atlas
```

**Data handling:** Nessie is an upstream synthetic data source; MongoDB is the app's persisted source for imported/normalized records and supplemental synthetic customer data. Keep external identifiers to support refresh and prevent duplicate imports.

**Financial integrity:** Keep account balances, obligations, and credit availability distinct. Do not double-count transfers, card purchases and repayments, or savings contributions. AI may explain computed outcomes but must not invent balances, forecast numbers, or approval decisions.

## Repository layout

```text
Financial-Positioning-System/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── engine/
│   │   ├── models/
│   │   ├── services/
│   │   └── middleware/
│   └── package.json
├── docs/
├── README.md
```

The folders under `src/` are a **recommended scaffold**, not an assertion that the code already exists.

## Environment and deployment

- **Render Static Site:** Build the Vite client (`client/`); publish its generated `dist/` directory.
- **Render Web Service:** Deploy Express from `server/`; set start script and bind to Render's supplied `PORT`.
- **MongoDB Atlas:** Configure backend-only access with `MONGODB_URI`.
- **Nessie:** Keep `NESSIE_API_KEY` on the server; backend imports/refreshes mock banking data.
- **Frontend:** Configure the public backend base URL (for example `VITE_API_BASE_URL`); this is **not** a secret.
- **CORS:** Allow the deployed frontend origin on the backend; do not publicly expose database credentials.
- **AI:** Store any eventual provider key only on the backend.

Example environment variable names (confirm when implementing):

```dotenv
# server/.env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
NESSIE_API_KEY=your_nessie_api_key

# client/.env
VITE_API_BASE_URL=http://localhost:5000
```

Never commit environment files or keys.

## Development rules

1. Use **JavaScript** on both client and server, with no unplanned TypeScript migration.
2. Call external services and the database **from Express**, not directly from the browser.
3. Keep Nessie integration separate from domain calculations so mock data can be reused reliably.
4. Prefer one coherent working flow: **import → view → forecast → simulate → recommend**.
5. Build the **PNC + Capital One MVP first**; the Toyota loan/vehicle module comes later.
6. Avoid adding technology solely for other sponsor-prize eligibility.

## Out of scope for this stack

No Tiger Data, Vultr, Solana, GoDaddy Registry, PostgreSQL, Supabase, Prisma, Cursor/Grok Bot, or other extra sponsor integrations. No real bank login, real-money transfers, or production underwriting.

See [`requirements.md`](./requirements.md) for product requirements and [`README.md`](../README.md) for project overview and initial setup.
