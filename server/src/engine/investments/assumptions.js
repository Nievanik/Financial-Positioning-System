/**
 * SYNTHETIC, HYPOTHETICAL ASSUMPTIONS for the Investment Planner (docs/engineering.md section 10).
 * Round illustrative numbers chosen by the FPS team — not market data, forecasts, or advice.
 * Rates are integer basis points (100 bps = 1%).
 */

export const ASSET_CLASSES = Object.freeze([
  { id: 'usStocks', label: 'U.S. stocks', volatilityBps: 1600, stressShockBps: -3000 },
  { id: 'intlStocks', label: 'International stocks', volatilityBps: 1800, stressShockBps: -3200 },
  { id: 'bonds', label: 'Bonds', volatilityBps: 600, stressShockBps: -500 },
  { id: 'cdsCash', label: 'CDs & cash equivalents', volatilityBps: 50, stressShockBps: 0 },
])

export const ASSET_CLASS_IDS = Object.freeze(ASSET_CLASSES.map((a) => a.id))

/** Hypothetical average annual returns (bps) per asset class under three illustrative scenarios. */
export const RETURN_SCENARIOS = Object.freeze([
  { id: 'low', label: 'Weak markets', returnsBps: { usStocks: 200, intlStocks: 100, bonds: 200, cdsCash: 300 } },
  { id: 'base', label: 'Middle case', returnsBps: { usStocks: 650, intlStocks: 600, bonds: 400, cdsCash: 380 } },
  { id: 'high', label: 'Strong markets', returnsBps: { usStocks: 950, intlStocks: 900, bonds: 500, cdsCash: 420 } },
])

export const ALLOCATION_PRESETS = Object.freeze([
  { id: 'conservative', label: 'Conservative', allocation: { usStocks: 20, intlStocks: 10, bonds: 50, cdsCash: 20 } },
  { id: 'balanced', label: 'Balanced', allocation: { usStocks: 45, intlStocks: 15, bonds: 30, cdsCash: 10 } },
  { id: 'growth', label: 'Growth', allocation: { usStocks: 65, intlStocks: 20, bonds: 12, cdsCash: 3 } },
])

/** Risk bands on simplified weighted volatility (bps); upper bounds are exclusive. */
export const RISK_BANDS = Object.freeze([
  { id: 'low', label: 'Low', belowBps: 500 },
  { id: 'moderate', label: 'Moderate', belowBps: 1000 },
  { id: 'elevated', label: 'Elevated', belowBps: 1400 },
  { id: 'high', label: 'High', belowBps: Infinity },
])

/** Account-level risk labels; `DEFAULT_RISK_BY_TYPE` applies when the data has no riskLevel. */
export const ACCOUNT_RISK_LEVELS = Object.freeze({
  low: { label: 'Low risk', note: 'Principal is generally stable; the rate is fixed for the term.' },
  moderate: { label: 'Moderate risk', note: 'A mix of stocks and bonds; value can fall in a bad year.' },
  high: { label: 'Higher risk', note: 'Mostly stocks; value can swing significantly year to year.' },
})
export const DEFAULT_RISK_BY_TYPE = Object.freeze({ cd: 'low', retirement: 'moderate', investment: 'high' })

export const PORTFOLIO_GROUPS = Object.freeze([
  { id: 'investment', label: 'Investments', types: ['investment'] },
  { id: 'retirement', label: 'Retirement', types: ['retirement'] },
  { id: 'cd', label: 'CDs', types: ['cd'] },
])

export const CD_RULES = Object.freeze({
  reminderLeadDays: 14,
  dueSoonDays: 30,
  hypotheticalRenewalRateBps: 375,
  renewalMonths: 12,
})

export const DISCLAIMER =
  'Educational simulation with synthetic data and hypothetical assumptions. Not investment advice, not a forecast, ' +
  'and not an offer. FPS never places trades, moves money, renews CDs or sends notifications.'

export const LIMITS = Object.freeze({ maxAmountCents: 1_000_000_000, minYears: 1, maxYears: 30, maxPlansPerProfile: 20, maxPlanName: 60 })
