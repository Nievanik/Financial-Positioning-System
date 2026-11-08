import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variableMonthlySpend, buildOverview, spendByCategory, incomeMonthlyCents } from './snapshot.js';

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

test('income: overview lists only income flows (next payday first); monthly income uses net take-home', () => {
  const flows = [
    { kind: 'income', name: 'Pay', signedAmountCents: 120000, grossAmountCents: 150000, frequency: 'biweekly', nextDate: '2026-11-20' },
    { kind: 'income', name: 'Side gig', signedAmountCents: 20000, frequency: 'monthly', nextDate: '2026-11-12' },
    { kind: 'bill', name: 'Rent', signedAmountCents: -100000, frequency: 'monthly', nextDate: '2026-11-01' },
  ];
  const o = buildOverview({ profile: {}, asOf: '2026-11-08', accounts: [], loans: [], flows });
  assert.deepEqual(o.income.map((i) => [i.name, i.amountCents, i.grossAmountCents]), [['Side gig', 20000, null], ['Pay', 120000, 150000]]);
  assert.deepEqual(o.obligations.map((x) => x.name), ['Rent']);
  assert.equal(incomeMonthlyCents(flows), Math.round((120000 * 26) / 12) + 20000);
  assert.equal(incomeMonthlyCents([]), 0);
});

test('overview: supplemental CDs/brokerage count in long-term totals and net worth, never in cash; metadata passes through', () => {
  const o = buildOverview({
    profile: { slug: 's', displayName: 'S', currency: 'USD', timeZone: 'x', lastSyncedAt: null }, asOf: '2026-11-08',
    accounts: [
      { type: 'checking', balanceCents: 100 }, { type: 'savings', balanceCents: 200 }, { type: 'retirement', balanceCents: 5000 },
      { type: 'cd', balanceCents: 400, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-12', source: 'supplemental_synthetic' },
      { type: 'investment', balanceCents: 600, riskLevel: 'high', holdingsNote: 'ETFs', source: 'supplemental_synthetic' },
    ],
    loans: [], flows: [],
  });
  assert.equal(o.cash.availableCents, 300);
  assert.equal(o.totals.retirementAndInvestmentsCents, 5000 + 400 + 600);
  assert.equal(o.totals.netWorthCents, 300 + 6000);
  const cd = o.accounts.find((a) => a.type === 'cd');
  assert.deepEqual([cd.riskLevel, cd.annualRateBps, cd.maturityDate, cd.source], ['low', 410, '2026-12-12', 'supplemental_synthetic']);
  assert.equal(o.accounts.find((a) => a.type === 'checking').maturityDate, null);
});

test('overview: a loan_payment obligation carries its loanId (display link only; amount unchanged, counted once)', () => {
  const flows = [
    { kind: 'loan_payment', name: 'Auto loan', signedAmountCents: -22000, frequency: 'monthly', nextDate: '2026-11-18', category: 'debt', loanId: 'L1' },
    { kind: 'bill', name: 'Rent', signedAmountCents: -100000, frequency: 'monthly', nextDate: '2026-12-01', category: 'housing' },
  ];
  const o = buildOverview({ profile: {}, asOf: '2026-11-08', accounts: [], loans: [{ _id: 'L1', outstandingCents: 600000 }], flows });
  assert.deepEqual(o.obligations.map((x) => [x.name, x.loanId, x.amountCents]), [['Auto loan', 'L1', 22000], ['Rent', null, 100000]]);
});
