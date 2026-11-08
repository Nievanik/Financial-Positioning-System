import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNessieClient, NessieError } from './client.js';

const KEY = 'SECRET-KEY-123';
const json = (status, body) => async () => new Response(JSON.stringify(body), { status });

test('errors never expose the API key', async () => {
  const failing = createNessieClient({ apiKey: KEY, fetchImpl: async (url) => { throw new Error(`boom ${url}`); } });
  const http500 = createNessieClient({ apiKey: KEY, fetchImpl: json(500, { message: 'bad' }) });
  for (const c of [failing, http500]) {
    const e = await c.listAccounts('c1').catch((x) => x);
    assert.ok(e instanceof NessieError);
    assert.ok(!JSON.stringify([e.message, e.path, e.stack, e.cause]).includes(KEY));
  }
});

test('POST without status or with extra transfer keys is rejected before any request', () => {
  let called = false;
  const c = createNessieClient({ apiKey: KEY, fetchImpl: async () => { called = true; return new Response('{}'); } });
  assert.throws(() => c.createRecord('a1', 'purchases', { amount: 5 }), /requires status/);
  assert.throws(() => c.createRecord('a1', 'transfers', { status: 'completed', amount: 5, transaction_date: '2026-10-01', medium: 'balance' }), /rejects keys: medium/);
  assert.throws(() => c.createRecord('a1', 'bills', { status: 'recurring', payee: 'X' }), /bills POST missing: payment_date/);
  assert.equal(called, false);
});

test('sends the key as a query param and builds the right path', async () => {
  let seen;
  const c = createNessieClient({ apiKey: KEY, baseUrl: 'https://x.test', fetchImpl: async (url) => { seen = new URL(url); return new Response('[]'); } });
  await c.list('a1', 'bills');
  assert.equal(seen.pathname, '/accounts/a1/bills');
  assert.equal(seen.searchParams.get('key'), KEY);
});
