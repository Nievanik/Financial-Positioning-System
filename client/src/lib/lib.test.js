// Pure client helpers (no React, no `@/` aliases), so Node's built-in runner is enough: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adaptHealthMetrics, adaptOverview } from './apiAdapters.js'
import { addDays, addMonths, daysBetween, formatDay } from './dates.js'
import { indicatorStatus } from './indicatorLabels.js'
import { centsToInput, dollarsToCents, formatCents } from './money.js'

test('money: dollar text <-> integer cents without float drift; display formatting', () => {
  assert.equal(dollarsToCents('2,000'), 200000)
  assert.equal(dollarsToCents('0.1'), 10)
  assert.equal(dollarsToCents('19.99'), 1999)
  assert.equal(dollarsToCents('abc'), null)
  assert.equal(dollarsToCents('1.234'), null)
  assert.equal(centsToInput(520), '5.20')
  assert.equal(centsToInput(200000), '2000')
  assert.equal(centsToInput(null), '')
  assert.equal(formatCents(-134229, { whole: true }), '−$1,342')
  assert.equal(formatCents(50000, { whole: true, signed: true }), '+$500')
})

test('dates: calendar days stay calendar days (no timezone shift), month clipping', () => {
  assert.equal(addDays('2026-11-08', 1), '2026-11-09')
  assert.equal(addMonths('2027-01-31', 1), '2027-02-28')
  assert.equal(daysBetween('2026-11-08', '2026-12-12'), 34)
  assert.equal(formatDay('2026-11-30'), 'Nov 30, 2026')
})

test('indicator labels use the documented thresholds and never change values', () => {
  assert.equal(indicatorStatus('emergencyCoverage', { months: 3 }), 'good')
  assert.equal(indicatorStatus('emergencyCoverage', { months: 0.35 }), 'risk')
  assert.equal(indicatorStatus('debtPaymentBurden', { ratio: 0.29 }), 'caution')
  assert.equal(indicatorStatus('cashFlowSafety', { minCashCents: 5000000, daysBelowFloor: 1 }), 'risk')
  assert.equal(indicatorStatus('cashFlowSafety', { minCashCents: 50000, daysBelowFloor: 0 }), 'caution')
  assert.equal(indicatorStatus('emergencyCoverage', { months: null }), 'unknown')
  const h = adaptHealthMetrics({ indicators: { emergencyCoverage: { months: 0.349 }, debtPaymentBurden: { ratio: 0.18 }, cashFlowSafety: { minCashCents: -187192, daysBelowFloor: 100 } } })
  assert.deepEqual(h.indicators.map((i) => [i.id, i.value, i.status]), [
    ['emergency_coverage', 0.349, 'risk'],
    ['debt_payment_burden', 0.18, 'good'],
    ['cash_flow_safety', -187192, 'risk'],
  ])
})

test('overview adapter: income is a positive inflow, obligations negative, totals untouched', () => {
  const o = adaptOverview({
    cash: { availableCents: 105000, checkingCents: 90000, savingsCents: 15000 },
    totals: { retirementAndInvestmentsCents: 365000, netWorthCents: -850000, creditCardDebtCents: 220000, creditLimitCents: 400000, unusedCreditCents: 180000, loanDebtCents: 1100000 },
    accounts: [{ id: 'a1', type: 'cd', balanceCents: 200000, maturityDate: '2026-12-20' }],
    income: [{ name: 'Salary', amountCents: 300000, grossAmountCents: 370000, frequency: 'monthly', nextDate: '2026-11-28' }],
    obligations: [{ name: 'Rent', kind: 'bill', amountCents: 140000, frequency: 'monthly', nextDate: '2026-12-01' }],
  })
  assert.equal(o.cash.availableCashCents, 105000)
  assert.equal(o.cash.longTermCents, 365000)
  assert.equal(o.income[0].signedAmountCents, 300000)
  assert.equal(o.income[0].kind, 'income')
  assert.equal(o.obligations[0].signedAmountCents, -140000)
  assert.equal(o.accounts[0].maturityDate, '2026-12-20')
  assert.deepEqual(adaptOverview({ cash: {}, totals: {} }).income, [])
})
