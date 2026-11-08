import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionQuery } from './transactions.js';

const A = '6aeff92b88371dec44343312';
const B = '6aeff92b88371dec44343313';
const OTHER_PROFILE = '6aeff92b88371dec44343399';
const ctx = { profileId: 'p1', accountIds: [A, B], categories: ['groceries', 'housing'] };
const parse = (q) => parseTransactionQuery(q, ctx);
const rejects = (q, status, code) => assert.throws(() => parse(q), (e) => e.status === status && e.code === code, JSON.stringify(q));

test('no query: profile-scoped filter and default limit 50 (unchanged behaviour)', () => {
  assert.deepEqual(parse({}), { filter: { profileId: 'p1' }, limit: 50 });
});

test('accountId narrows the database filter, always together with profileId', () => {
  const { filter, limit } = parse({ accountId: A, limit: '100' });
  assert.deepEqual(filter, { profileId: 'p1', accountId: A });
  assert.equal(limit, 100);
});

test('accountId combines with category and date range', () => {
  const { filter } = parse({ accountId: B, category: 'groceries', from: '2026-10-01', to: '2026-10-31' });
  assert.equal(filter.profileId, 'p1');
  assert.equal(filter.accountId, B);
  assert.equal(filter.category, 'groceries');
  assert.deepEqual(filter.occurredAt, { $gte: new Date('2026-10-01T00:00:00Z'), $lte: new Date('2026-10-31T23:59:59Z') });
});

test('accountId is matched case-insensitively and normalised to lower case', () => {
  assert.equal(parse({ accountId: A.toUpperCase() }).filter.accountId, A);
});

test('malformed accountId -> 400 VALIDATION_FAILED', () => {
  for (const accountId of ['', 'abc', `${A}0`, 'zzzzzzzzzzzzzzzzzzzzzzzz', ['x'], { $ne: null }]) rejects({ accountId }, 400, 'VALIDATION_FAILED');
});

test("another profile's account id -> 404 ACCOUNT_NOT_FOUND (never leaks other data)", () => {
  rejects({ accountId: OTHER_PROFILE }, 404, 'ACCOUNT_NOT_FOUND');
});

test('existing validation still applies', () => {
  rejects({ limit: '0' }, 400, 'VALIDATION_FAILED');
  rejects({ limit: '101' }, 400, 'VALIDATION_FAILED');
  rejects({ limit: '2.5' }, 400, 'VALIDATION_FAILED');
  rejects({ from: '2026/10/01' }, 400, 'VALIDATION_FAILED');
  rejects({ to: ['2026-10-01'] }, 400, 'VALIDATION_FAILED');
  rejects({ category: 'yachts' }, 400, 'VALIDATION_FAILED');
});
