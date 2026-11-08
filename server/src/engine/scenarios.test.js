import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScenario } from './scenarios.js';

const input = { asOf: '2026-11-07', openingCashCents: 1000000, flows: [] };
const d = (s) => Object.values(evaluateScenario(input, s).deltas);

test('one-time expense only hits checkpoints on/after its start date', () => {
  assert.deepEqual(d({ type: 'one_time', amountCents: 200000, startDate: '2026-12-01' }), [0, -200000, -200000, -200000]);
});

test('down payment + recurring stops after durationMonths', () => {
  const s = { type: 'down_payment_recurring', downPaymentCents: 100000, monthlyAmountCents: 30000, startDate: '2027-01-01', durationMonths: 2 };
  assert.deepEqual(d(s), [0, 0, -130000, -160000]);
});

test('spending reduction adds cash, truncated at the 6-month horizon', () => {
  const s = { type: 'monthly_spending_reduction', monthlyAmountCents: 10000, startDate: '2026-12-01', durationMonths: 6 };
  assert.deepEqual(d(s), [0, 10000, 20000, 50000]); // Dec..Apr = 5 occurrences by 2027-04-30
});

test('scenario shortfall is reported; baseline untouched; bad input rejected', () => {
  const r = evaluateScenario(input, { type: 'one_time', amountCents: 1500000, startDate: '2026-11-20' });
  assert.equal(r.assessment.firstShortfallDate, '2026-11-20');
  assert.equal(r.baseline.shortfalls.length, 0);
  assert.equal(input.flows.length, 0);
  assert.throws(() => evaluateScenario(input, { type: 'one_time', amountCents: 5, startDate: '2026-11-01' }), { code: 'INVALID_SCENARIO' });
});

test('recommendations are re-simulated, quantified, and omitted when they do not help', () => {
  const a = evaluateScenario(input, { type: 'one_time', amountCents: 1500000, startDate: '2026-11-20' });
  assert.deepEqual(a.recommendations.map((r) => r.id), ['cut_discretionary']); // delay changes nothing here
  assert.equal(a.recommendations[0].impactMonth6Cents, 50000);

  const withIncome = { ...input, flows: [{ kind: 'income', signedAmountCents: 500000, frequency: 'monthly', nextDate: '2026-12-05' }] };
  const b = evaluateScenario(withIncome, { type: 'one_time', amountCents: 1200000, startDate: '2026-11-20' });
  const delay = b.recommendations.find((r) => r.id === 'delay_one_month');
  assert.equal(delay.impactMinimumCashCents, 500000); // min goes from -200000 to 300000
});
