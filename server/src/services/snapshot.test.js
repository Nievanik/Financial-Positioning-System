import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variableMonthlySpend, buildOverview, spendByCategory } from './snapshot.js';

const tx = (category, amountCents, extra = {}) => ({ category, amountCents, cashflowKind: 'cash_expense', isRecurringCandidate: false, ...extra });

test('variable spend skips scheduled rows, ignores transfers/debt payments, and honors overrides', () => {
  const txs = [
    tx('groceries', 30000), tx('groceries', 30000),
    tx('housing', 100000, { isRecurringCandidate: true }), // rent is a recurring flow already
    tx('debt', 5000, { cashflowKind: 'loan_payment' }),
    tx('savings', 7000, { cashflowKind: 'internal_transfer' }),
    tx('other', 9000, { cashflowKind: 'credit_purchase' }),
  ];
  assert.deepEqual(variableMonthlySpend(txs, { historyMonths: 3 }), { byCategory: { groceries: 20000, other: 3000 }, totalCents: 23000 });
  assert.equal(variableMonthlySpend(txs, { historyMonths: 3, categoryOverridesCents: { groceries: 1000 } }).totalCents, 4000);
  assert.deepEqual(spendByCategory(txs), { groceries: 60000, housing: 100000, other: 9000 }); // bills count as spending
});

test('overview: retirement and credit limit never count as cash; net worth subtracts card and loans', () => {
  const o = buildOverview({
    profile: { slug: 's', displayName: 'S', currency: 'USD', timeZone: 'x', lastSyncedAt: null }, asOf: '2026-11-08',
    accounts: [
      { type: 'checking', balanceCents: 100 }, { type: 'savings', balanceCents: 200 }, { type: 'retirement', balanceCents: 5000 },
      { type: 'credit_card', balanceCents: 300, creditLimitCents: 1000 },
    ],
    loans: [{ outstandingCents: 700 }], flows: [],
  });
  assert.equal(o.cash.availableCents, 300);
  assert.equal(o.totals.unusedCreditCents, 700);
  assert.equal(o.totals.netWorthCents, 100 + 200 + 5000 - 300 - 700);
});
