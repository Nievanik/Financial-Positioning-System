/**
 * Pure allocation math for hypothetical portfolio scenarios. Integer percents in, integer cents and
 * basis points out. No Express, Mongo or randomness.
 */
import { ASSET_CLASSES, ASSET_CLASS_IDS, RETURN_SCENARIOS, RISK_BANDS } from './assumptions.js'

export function allocationTotal(allocation) {
  return ASSET_CLASS_IDS.reduce((s, id) => s + (allocation[id] ?? 0), 0)
}

/** True when every class is an integer 0–100, no unknown keys, and the total is exactly 100. */
export function isValidAllocation(allocation) {
  if (!allocation || typeof allocation !== 'object' || Array.isArray(allocation)) return false
  if (Object.keys(allocation).some((k) => !ASSET_CLASS_IDS.includes(k))) return false
  const ok = ASSET_CLASS_IDS.every((id) => Number.isInteger(allocation[id]) && allocation[id] >= 0 && allocation[id] <= 100)
  return ok && allocationTotal(allocation) === 100
}

/** Allocation-weighted annual return for one scenario, rounded to whole basis points. */
export function weightedReturnBps(allocation, scenario) {
  const sum = ASSET_CLASS_IDS.reduce((s, id) => s + allocation[id] * scenario.returnsBps[id], 0)
  return Math.round(sum / 100)
}

/** Simplified weighted volatility (ignores correlations), whole basis points. */
export function weightedVolatilityBps(allocation) {
  return Math.round(ASSET_CLASSES.reduce((s, a) => s + allocation[a.id] * a.volatilityBps, 0) / 100)
}

export function riskBand(volatilityBps) {
  const band = RISK_BANDS.find((b) => volatilityBps < b.belowBps)
  return { volatilityBps, band: band.id, label: band.label }
}

/** Value after `year` years of annual compounding, rounded to integer cents from the principal. */
export function compoundCents(amountCents, rateBps, year) {
  return Math.round(amountCents * (1 + rateBps / 10_000) ** year)
}

export function stressLoss(amountCents, allocation) {
  const shockBps = Math.round(ASSET_CLASSES.reduce((s, a) => s + allocation[a.id] * a.stressShockBps, 0) / 100)
  return { shockBps, lossCents: Math.round((amountCents * shockBps) / 10_000) }
}

/**
 * Full hypothetical simulation for an already-validated input.
 * @param {{ allocation: Record<string, number>, amountCents: number, years: number }} input
 */
export function simulateAllocation({ allocation, amountCents, years }) {
  const scenarios = RETURN_SCENARIOS.map((s) => {
    const annualReturnBps = weightedReturnBps(allocation, s)
    return { id: s.id, label: s.label, annualReturnBps, finalValueCents: compoundCents(amountCents, annualReturnBps, years) }
  })
  const projection = Array.from({ length: years + 1 }, (_, year) => {
    const row = { year }
    scenarios.forEach((s) => {
      row[s.id] = compoundCents(amountCents, s.annualReturnBps, year)
    })
    return row
  })
  return {
    input: { allocation: { ...allocation }, amountCents, years },
    risk: riskBand(weightedVolatilityBps(allocation)),
    scenarios,
    projection,
    stress: stressLoss(amountCents, allocation),
  }
}
