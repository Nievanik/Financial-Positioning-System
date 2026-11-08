import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAccount, parseFlow, parseLoan, parseOverrides } from './edits.js';

const asOf = '2026-11-07';
const categories = ['housing', 'groceries', 'other'];
const ctx = { asOf, categories };
const rejects = (fn) => assert.throws(fn, (e) => e.status === 400 && e.code === 'VALIDATION_FAILED');

test('flow sign comes from kind, never from the client', () => {
  const rent = parseFlow({ name: 'Rent', kind: 'bill', amountCents: 150000, frequency: 'monthly', nextDate: '2026-12-01', category: 'housing' }, ctx);
  assert.equal(rent.signedAmountCents, -150000);
  const pay = parseFlow({ name: 'Pay', kind: 'income', amountCents: 200000, frequency: 'biweekly', nextDate: '2026-11-14', category: 'housing' }, ctx);
  assert.equal(pay.signedAmountCents, 200000);
  assert.equal(pay.category, 'income');
});

test('flow rejects loan_payment, negative/fractional cents, past or invalid dates, unknown category', () => {
  const ok = { name: 'Rent', kind: 'bill', amountCents: 100, frequency: 'monthly', nextDate: '2026-12-01' };
  rejects(() => parseFlow({ ...ok, kind: 'loan_payment' }, ctx));
  rejects(() => parseFlow({ ...ok, amountCents: -100 }, ctx));
  rejects(() => parseFlow({ ...ok, amountCents: 10.5 }, ctx));
  rejects(() => parseFlow({ ...ok, nextDate: asOf }, ctx));
  rejects(() => parseFlow({ ...ok, nextDate: '2026-02-30' }, ctx));
  rejects(() => parseFlow({ ...ok, endDate: '2026-11-30' }, ctx));
  rejects(() => parseFlow({ ...ok, category: 'yachts' }, ctx));
  rejects(() => parseFlow({ ...ok, name: '  ' }, ctx));
});

test('loan payment becomes exactly one negative monthly flow on the next due day', () => {
  const { loan, flow } = parseLoan({ name: 'Car', loanType: 'auto', outstandingCents: 1200000, monthlyPaymentCents: 35000, dueDay: 15 }, { asOf });
  assert.equal(loan.annualRateBps, null);
  assert.deepEqual(flow, { name: 'Car', kind: 'loan_payment', signedAmountCents: -35000, frequency: 'monthly', nextDate: '2026-11-15', category: 'debt' });
  assert.equal(parseLoan({ ...loan, dueDay: 3 }, { asOf }).flow.nextDate, '2026-12-03');
  rejects(() => parseLoan({ ...loan, dueDay: 31 }, { asOf }));
  rejects(() => parseLoan({ ...loan, monthlyPaymentCents: 0 }, { asOf }));
});

test('accounts: credit limit only on cards; overrides validate category and cents', () => {
  assert.deepEqual(parseAccount({ name: 'Visa', balanceCents: 500, creditLimitCents: 100000 }, 'credit_card'), { name: 'Visa', balanceCents: 500, creditLimitCents: 100000 });
  rejects(() => parseAccount({ name: 'Chk', balanceCents: 500, creditLimitCents: 1 }, 'checking'));
  rejects(() => parseAccount({ name: 'Chk', balanceCents: -1 }, 'checking'));
  assert.deepEqual(parseOverrides({ categoryOverridesCents: { groceries: 40000 } }, categories), { groceries: 40000 });
  rejects(() => parseOverrides({ categoryOverridesCents: { yachts: 1 } }, categories));
  rejects(() => parseOverrides({ categoryOverridesCents: { groceries: '4' } }, categories));
});
