import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast } from './forecast.js';

const on = (r, date) => r.daily.find((d) => d.date === date).cashCents;

test('mid-month shortfall is flagged even though month-end recovers', () => {
  const r = forecast({
    asOf: '2026-11-07',
    openingCashCents: 100000,
    flows: [
      { kind: 'bill', signedAmountCents: -150000, frequency: 'monthly', nextDate: '2026-11-10' },
      { kind: 'income', signedAmountCents: 300000, frequency: 'monthly', nextDate: '2026-11-28' },
    ],
  });
  assert.equal(r.shortfalls[0].date, '2026-11-10');
  assert.equal(r.shortfalls[0].cashCents, -50000);
  assert.equal(r.checkpoints[0].date, '2026-11-30');
  assert.ok(r.checkpoints[0].cashCents > 0);
});

test('checkpoints are months 1/2/3/6 month-ends; day-31 flows clip to short months', () => {
  const r = forecast({
    asOf: '2026-11-07',
    openingCashCents: 0,
    flows: [{ kind: 'bill', signedAmountCents: -100, frequency: 'monthly', nextDate: '2026-12-31' }],
  });
  assert.deepEqual(r.checkpoints.map((c) => c.date), ['2026-11-30', '2026-12-31', '2027-01-31', '2027-04-30']);
  assert.equal(on(r, '2027-02-28') - on(r, '2027-02-27'), -100);
});

test('variable spend is weekly; inactive and ended flows are ignored; loan counted once', () => {
  const r = forecast({
    asOf: '2026-11-07',
    openingCashCents: 1000000,
    variableMonthlySpendCents: 40000,
    flows: [
      { kind: 'loan_payment', signedAmountCents: -30000, frequency: 'monthly', nextDate: '2026-11-15' },
      { kind: 'bill', signedAmountCents: -99999, frequency: 'monthly', nextDate: '2026-11-15', active: false },
      { kind: 'bill', signedAmountCents: -77777, frequency: 'monthly', nextDate: '2026-11-15', endDate: '2026-11-20' },
    ],
  });
  assert.equal(on(r, '2026-11-14'), 1000000 - 9231); // round(40000*12/52), first event asOf+7
  assert.equal(on(r, '2026-11-15') - on(r, '2026-11-14'), -30000 - 77777);
  assert.equal(on(r, '2026-12-15') - on(r, '2026-12-14'), -30000); // ended flow gone; loan once
});
