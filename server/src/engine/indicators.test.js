import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emergencyCoverage, debtPaymentBurden, cashFlowSafety } from './indicators.js';
import { forecast } from './forecast.js';

const flows = [
  { kind: 'income', signedAmountCents: 300000, grossAmountCents: 400000, frequency: 'monthly', nextDate: '2026-11-28' },
  { kind: 'loan_payment', signedAmountCents: -40000, frequency: 'monthly', nextDate: '2026-11-15' },
  { kind: 'credit_card_payment', signedAmountCents: -10000, frequency: 'monthly', nextDate: '2026-11-20', active: false },
];

test('emergency coverage counts essential categories + debt only; null with no costs', () => {
  const spend = { housing: 100000, groceries: 20000, entertainment: 999999 };
  assert.equal(emergencyCoverage({ availableCashCents: 320000, monthlySpendByCategory: spend, flows }), 2); // 320k / (120k + 40k)
  assert.equal(emergencyCoverage({ availableCashCents: 1, flows: [] }), null);
});

test('debt burden uses gross income and skips inactive flows; null with no income', () => {
  assert.equal(debtPaymentBurden({ flows }), 0.1); // 40k / 400k
  assert.equal(debtPaymentBurden({ flows: [] }), null);
});

test('cash-flow safety reports the minimum and days below floor', () => {
  const r = forecast({
    asOf: '2026-11-07',
    openingCashCents: 100000,
    flows: [{ kind: 'bill', signedAmountCents: -150000, frequency: 'monthly', nextDate: '2026-11-10' }],
  });
  const s = cashFlowSafety(r);
  assert.equal(s.minCashCents, 100000 - 6 * 150000); // only outflows: bills Nov..Apr, minimum is the last day
  assert.ok(s.daysBelowFloor > 0);
});
