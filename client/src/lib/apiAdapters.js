/**
 * Response adapters: map the server's response shapes (docs/engineering.md section 5 route notes) to the
 * props the UI components use. Pure renames/reshaping plus documented display labels — they never
 * recompute or alter a financial value.
 */
import { indicatorStatus } from './indicatorLabels'

const str = (v) => (v === null || v === undefined ? v : String(v))

/** GET /overview: `cash` (spendable) + `totals` (everything else) -> one `cash` object for the cards. */
export function adaptOverview(o) {
  if (!o) return o
  const cash = o.cash || {}
  const totals = o.totals || {}
  return {
    ...o,
    cash: {
      availableCashCents: cash.availableCents ?? cash.availableCashCents,
      checkingCents: cash.checkingCents,
      savingsCents: cash.savingsCents,
      creditCardDebtCents: totals.creditCardDebtCents,
      creditLimitCents: totals.creditLimitCents,
      unusedCreditCents: totals.unusedCreditCents,
      loanDebtCents: totals.loanDebtCents,
      longTermCents: totals.retirementAndInvestmentsCents,
      netWorthCents: totals.netWorthCents,
    },
    accounts: (o.accounts || []).map((a) => ({ ...a, id: str(a.id) })),
    loans: (o.loans || []).map((l) => ({ ...l, id: str(l.id) })),
    // Server sends outflows as positive `amountCents`; the list shows them as signed cash effects.
    obligations: (o.obligations || []).map((f, i) => ({
      ...f,
      id: str(f.id) ?? `${f.name}-${f.nextDate}-${i}`,
      signedAmountCents: f.signedAmountCents ?? (typeof f.amountCents === 'number' ? -f.amountCents : undefined),
    })),
    // Income flows (`{ name, amountCents, grossAmountCents, frequency, nextDate }`, net take-home pay) are inflows:
    // same amount, positive sign. Absent from older overview responses, which yields an empty list.
    income: (o.income || []).map((f, i) => ({
      ...f,
      id: str(f.id) ?? `income-${f.name}-${f.nextDate}-${i}`,
      kind: f.kind ?? 'income',
      signedAmountCents: f.signedAmountCents ?? (typeof f.amountCents === 'number' ? f.amountCents : undefined),
    })),
  }
}

const INDICATOR_TEXT = {
  emergencyCoverage: {
    id: 'emergency_coverage',
    label: 'Emergency coverage',
    unit: 'months',
    summary: 'How many months of essential costs your checking + savings could cover.',
    detail: 'Available cash ÷ typical essential monthly costs (housing, utilities, groceries, transport, health) plus scheduled debt payments.',
    target: '3–6 months is a common guideline.',
  },
  debtPaymentBurden: {
    id: 'debt_payment_burden',
    label: 'Debt-payment burden',
    unit: 'ratio',
    summary: 'Share of gross monthly income that goes to scheduled loan and card payments.',
    detail: 'Scheduled monthly debt payments ÷ expected gross monthly income (gross pay is supplemental synthetic data).',
    target: 'Under 20% is comfortable; above 36% is high.',
    isEstimate: true,
  },
  cashFlowSafety: {
    id: 'cash_flow_safety',
    label: 'Cash-flow safety',
    unit: 'cents',
    summary: 'Lowest projected daily cash balance over the six-month forecast.',
    detail: 'Minimum of the deterministic daily forecast and the number of days below your cash floor.',
    target: 'Zero days below the floor.',
  },
}

/** GET /health-metrics `{ indicators: { emergencyCoverage: { months }, ... } }` -> indicator cards. */
export function adaptHealthMetrics(h) {
  if (!h || Array.isArray(h.indicators)) return h
  const ind = h.indicators || {}
  const values = {
    emergencyCoverage: ind.emergencyCoverage?.months ?? null,
    debtPaymentBurden: ind.debtPaymentBurden?.ratio ?? null,
    cashFlowSafety: ind.cashFlowSafety?.minCashCents ?? null,
  }
  return {
    ...h,
    indicators: Object.keys(INDICATOR_TEXT)
      .filter((k) => k in ind)
      .map((k) => ({
        ...INDICATOR_TEXT[k],
        value: values[k],
        daysBelowFloor: k === 'cashFlowSafety' ? ind.cashFlowSafety?.daysBelowFloor : undefined,
        status: indicatorStatus(k, ind[k]),
      })),
  }
}
