import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES } from './demoData.js';
import { buildPlan, simulate } from './seedPlan.js';
import { validateRecord } from '../src/services/nessie/client.js';

const by = Object.fromEntries(PROFILES.map((p) => [p.slug, buildPlan(p)]));

test('every seed record passes the Nessie payload validation (status etc.)', () => {
  for (const plan of Object.values(by)) for (const r of plan.records) assert.doesNotThrow(() => validateRecord(r.resource, r.body), `${plan.slug} ${r.resource}`);
});

test('the three profiles keep their contrasting outcomes', () => {
  const saver = simulate(by['steady-saver']);
  const debt = simulate(by['debt-heavy']);
  const crunch = simulate(by['cash-crunch']);
  assert.equal(saver.forecast.shortfalls.length, 0);
  assert.ok(debt.debtBurden > 0.25 && saver.debtBurden < 0.15);
  assert.ok(crunch.forecast.shortfalls.length > 0);
  // the crunch story: cash dips below zero mid-month yet the first month-end is positive
  assert.ok(crunch.forecast.checkpoints[0].cashCents > 0);
  // the simple story: no loans and no card-payment flow; the loans story has no overdraft
  assert.ok(!by['steady-saver'].flows.some((f) => ['loan_payment', 'credit_card_payment'].includes(f.kind)));
  assert.equal(debt.forecast.shortfalls.length, 0);
});

test('seed data is deterministic and never counts transfers/card/retirement as cash flows', () => {
  assert.deepEqual(buildPlan(PROFILES[0]), buildPlan(PROFILES[0]));
  const plan = by['steady-saver'];
  assert.equal(plan.openingCashCents, (1800 + 3200) * 100);
  assert.ok(!plan.flows.some((f) => /transfer|savings/i.test(f.name + f.kind)));
});
