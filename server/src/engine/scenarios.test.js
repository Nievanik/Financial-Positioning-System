import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baselineRecommendations, evaluateScenario } from './scenarios.js';

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

test('recommendations carry a structured scenario only when it can be evaluated on its own', () => {
  const withIncome = { ...input, flows: [{ kind: 'income', signedAmountCents: 500000, frequency: 'monthly', nextDate: '2026-12-05' }] };
  const scenario = { type: 'one_time', name: 'Laptop', amountCents: 1200000, startDate: '2026-11-20' };
  const recs = evaluateScenario(withIncome, scenario).recommendations;
  const delay = recs.find((r) => r.id === 'delay_one_month');
  assert.deepEqual(delay.scenario, { ...scenario, startDate: '2026-12-20' });
  assert.match(delay.action, /^Start on 2026-12-20 instead of 2026-11-20$/); // text preserved
  // Re-evaluating the structured scenario reproduces the recommendation's impact.
  const replay = evaluateScenario(withIncome, delay.scenario);
  const current = evaluateScenario(withIncome, scenario);
  assert.equal(Math.min(...replay.scenario.daily.map((d) => d.cashCents)) - Math.min(...current.scenario.daily.map((d) => d.cashCents)), delay.impactMinimumCashCents);
  assert.equal(recs.find((r) => r.id === 'cut_discretionary').scenario, null); // only meaningful combined with the laptop

  // A delay that would start after the month-6 checkpoint keeps its text but is not offered as a request.
  const late = evaluateScenario(withIncome, { ...scenario, startDate: '2027-04-10' }).recommendations.find((r) => r.id === 'delay_one_month');
  assert.equal(late.action, 'Start on 2027-05-10 instead of 2027-04-10');
  assert.equal(late.scenario, null);

  const base = baselineRecommendations(withIncome);
  assert.ok(base.length > 0);
  for (const r of base) {
    assert.equal(r.scenario.type, 'monthly_spending_reduction');
    assert.equal(r.scenario.monthlyAmountCents, Number(r.id.split('_')[1]) * 100);
    assert.match(r.action, /^Spend \$\d+ less per month from \d{4}-\d{2}-01$/);
    const replayBase = evaluateScenario(withIncome, r.scenario); // valid standalone request
    assert.equal(replayBase.deltas.month6Cents, r.impactMonth6Cents);
  }
});
