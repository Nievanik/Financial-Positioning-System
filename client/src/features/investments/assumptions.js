/**
 * UI-only display constants for the Investment Planner. All numeric assumptions (returns, volatility,
 * stress shocks, CD renewal rate) are owned by the server: GET /api/v1/investments/assumptions.
 */
export const ASSET_CLASS_COLORS = {
  usStocks: 'var(--chart-2)',
  intlStocks: 'var(--chart-4)',
  bonds: 'var(--chart-3)',
  cdsCash: 'var(--chart-1)',
}
export const SCENARIO_COLORS = { low: 'var(--destructive)', base: 'var(--chart-2)', high: 'var(--success)' }
export const GROUP_COLORS = { investment: 'var(--chart-2)', retirement: 'var(--chart-4)', cd: 'var(--chart-3)' }
export const RISK_BADGE = { low: 'success', moderate: 'warning', elevated: 'warning', high: 'destructive' }
