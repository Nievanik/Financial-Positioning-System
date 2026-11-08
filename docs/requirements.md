# HackUTD 2026 — Core Project Requirements

**Project:** Financial Positioning System (FPS)  
**Team:** 3 developers  
**Primary challenge:** PNC 360° Financial Health Navigator  
**Banking data:** Capital One Nessie API (synthetic data)  
**Future extension:** Toyota Financial Services (not in initial MVP)

## Project goal

Build a financial navigator that **understands a user's finances, forecasts future cash balances, and evaluates major spending decisions** with actionable suggestions.

## Must-have features

1. **Unified financial overview:** Show available checking/savings cash, credit-card balances and limits, loans, monthly obligations, income, savings, and retirement accounts/contributions. Pull available mock data from Nessie; supplement missing fields with clearly labeled synthetic data.
2. **Expense analysis:** Categorize historical transactions (groceries, entertainment, housing, etc.) and estimate recurring versus variable spending.
3. **Financial forecasting:** Estimate cash balances at **1, 2, 3, and 6 months**, accounting for expected income, spending, bills, loan payments, and savings contributions. Flag potential shortfalls between month-end dates.
4. **What-if simulator:** Add a **one-time purchase** (e.g., $2,000 laptop) or a **down payment plus recurring expense** (e.g., $10,000 down and $3,000/month for a house). Compare forecasts before and after the decision.
5. **Financial health + recommendations:** Show at least **3 understandable indicators** (emergency savings, debt-payment burden, cash-flow safety). Explain affordability risks and recommend specific cuts, delays, or alternatives, including their projected impact.
6. **AI explanation:** Explain forecasts and next steps in plain language using numbers calculated by the financial engine, not invented by AI. The in-app AI provider is **not yet selected**.

## Data and demo requirements

- **No user login:** Let the user choose a predefined, fictional customer profile.
- **Editable profile data:** The user can change the chosen profile's balances, recurring income and bills (e.g. rent), debts, and monthly spending estimates; every number on the dashboard recalculates from the new inputs. Transactions are not editable.
- **Nessie integration:** Retrieve synthetic banking data, import/normalize it into MongoDB, and refresh when needed.
- **Additional mock data:** Clearly label synthetic details that Nessie does not provide (such as particular retirement accounts or mortgage fields).
- **Numerical integrity:** Distinguish available cash from retirement funds and unused credit; avoid double-counting transfers, credit-card payments, or savings contributions.

## Definition of done

A working demo connects to Nessie, displays a fictional customer's finances, forecasts future balances, compares both one-time and recurring scenarios, and recommends a concrete action supported by calculations.

## Important boundaries

- Forecasts are **estimates**, not guaranteed outcomes or loan approvals.
- Only synthetic data; no real banking credentials or real-money transactions.
- **Toyota integration, real bank linking, and money transfers are out of scope for the initial MVP.**
- Forecasting method is decided (deterministic daily projection, see `engineering.md`); testing tooling is **to be decided**. Numerical checks remain required.

**Shared priority:** Deliver a polished **data → forecast → simulate → recommend** flow before adding more features.

For the confirmed technologies and open decisions, see [`techstack.md`](./techstack.md).
