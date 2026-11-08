/**
 * Display-only status labels for server health metrics, using the thresholds documented in
 * docs/engineering.md (section 5, "UI status labels"). They choose a badge; they never change a value.
 */
export const THRESHOLDS = {
  emergencyCoverageMonths: { good: 3, caution: 1 },
  debtBurdenRatio: { good: 0.2, caution: 0.36 },
  cashFlowCautionCents: 100000,
}

export function indicatorStatus(key, raw) {
  if (!raw) return 'unknown'
  if (key === 'emergencyCoverage') {
    const v = raw.months
    if (typeof v !== 'number') return 'unknown'
    return v >= THRESHOLDS.emergencyCoverageMonths.good ? 'good' : v >= THRESHOLDS.emergencyCoverageMonths.caution ? 'caution' : 'risk'
  }
  if (key === 'debtPaymentBurden') {
    const v = raw.ratio
    if (typeof v !== 'number') return 'unknown'
    return v <= THRESHOLDS.debtBurdenRatio.good ? 'good' : v <= THRESHOLDS.debtBurdenRatio.caution ? 'caution' : 'risk'
  }
  if (key === 'cashFlowSafety') {
    if (typeof raw.minCashCents !== 'number') return 'unknown'
    if (raw.daysBelowFloor > 0) return 'risk'
    return raw.minCashCents < THRESHOLDS.cashFlowCautionCents ? 'caution' : 'good'
  }
  return 'unknown'
}
