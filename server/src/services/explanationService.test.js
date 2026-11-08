import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explain, templateExplanation } from './explanationService.js';

const facts = { asOf: '2026-11-08', cashFloorCents: 0, firstShortfallDate: '2026-11-20', daysBelowFloor: 3, minCashCents: -6508, checkpoints: [{ date: '2026-11-30', cashCents: 256476 }, {}, {}, { date: '2027-04-30', cashCents: 113912 }] };

test('template uses only computed facts and states the shortfall', () => {
  const t = templateExplanation('forecast', facts);
  assert.match(t, /2026-11-20/);
  assert.match(t, /-\$65/);
  assert.match(t, /\$2,565/);
});

test('no provider, failing provider, or empty AI output all fall back to the template', async () => {
  const input = { subject: 'forecast', facts };
  assert.equal((await explain(input, { provider: undefined })).method, 'template');
  assert.equal((await explain(input, { provider: 'x', registry: { x: async () => { throw new Error('boom'); } } })).method, 'template');
  assert.equal((await explain(input, { provider: 'x', registry: { x: async () => '  ' } })).method, 'template');
  assert.deepEqual(await explain(input, { provider: 'x', registry: { x: async () => 'hi' } }), { text: 'hi', method: 'ai' });
});

test('scenario text does not claim to cause a shortfall the baseline already has', () => {
  const f = { name: 'Laptop', deltas: { month1Cents: 0 }, firstShortfallDate: '2026-11-20', baselineFirstShortfallDate: '2026-11-20' };
  assert.match(templateExplanation('scenario', f), /already falls below/);
  assert.match(templateExplanation('scenario', { ...f, baselineFirstShortfallDate: null }), /would cause/);
});
