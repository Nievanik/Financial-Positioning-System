import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MERCHANTS, PROFILES, ASOF } from './demoData.js';
import { buildPlan } from './seedPlan.js';
import { normalizeProfile } from '../src/services/nessie/normalize.js';

const merchants = Object.fromEntries(Object.entries(MERCHANTS).map(([key, m]) => [m.id, { key, name: m.name }]));

// Turn a seed plan back into what Nessie would return (ids invented, transfers use `id`).
function fakeNessie(plan) {
  let n = 0;
  const pick = (account, resource) => plan.records.filter((r) => r.account === account && r.resource === resource).map((r) => ({ _id: `id${n++}`, ...r.body }));
  return {
    accounts: [{ _id: 'chk', type: 'Checking', nickname: 'C', balance: 1 }, { _id: 'sav', type: 'Savings', nickname: 'S', balance: 1 }, { _id: 'crd', type: 'Credit Card', nickname: 'K', balance: 1 }],
    deposits: pick('checking', 'deposits'), withdrawals: pick('checking', 'withdrawals'), bills: pick('checking', 'bills'),
    loans: pick('checking', 'loans'), transfers: pick('checking', 'transfers').map(({ _id, ...t }) => ({ id: _id, ...t })),
    purchases: pick('checking', 'purchases'), cardPurchases: pick('card', 'purchases'),
  };
}
const run = (p) => normalizeProfile({
  asOf: ASOF, slug: p.slug, nessie: fakeNessie(buildPlan(p)), merchants,
  supplemental: { bills: p.bills, loans: p.loans.map((l) => ({ name: l.name, day: l.day, rateBps: l.rateBps })), retirement401kCents: 1, creditLimitCents: p.card.limit * 100, grossPayCents: p.pay.gross * 100 },
});

test('synced recurring flows equal the seed plan\'s engine flows (same amounts, frequency, nextDate)', () => {
  const key = (f) => `${f.name}|${f.kind}|${f.signedAmountCents}|${f.frequency}|${f.nextDate}|${f.grossAmountCents ?? ''}`;
  for (const p of PROFILES) {
    const out = run(p);
    assert.deepEqual(out.issues, [], p.slug);
    assert.deepEqual(out.flows.map(key).sort(), buildPlan(p).flows.map(key).sort(), p.slug);
  }
});

test('classification: transfers net zero, card purchases no cash impact, payroll is income', () => {
  const { transactions } = run(PROFILES[0]);
  const kinds = (k) => transactions.filter((t) => t.cashflowKind === k);
  assert.ok(kinds('internal_transfer').every((t) => t.cashImpactCents === 0 && t.transferGroupId));
  assert.ok(kinds('credit_purchase').length > 0 && kinds('credit_purchase').every((t) => t.cashImpactCents === 0));
  assert.ok(kinds('income').every((t) => t.cashImpactCents === t.amountCents));
  assert.ok(transactions.every((t) => t.amountCents >= 0 && Number.isInteger(t.cashImpactCents)));
});

test('unknown descriptions and mismatched loan payments stop the sync (issues)', () => {
  const p = PROFILES[0];
  const n = fakeNessie(buildPlan(p));
  n.withdrawals.push({ _id: 'x', description: 'Mystery', amount: 5, transaction_date: '2026-10-01' });
  n.withdrawals = n.withdrawals.map((w) => (w.description.startsWith('Loan payment') ? { ...w, amount: w.amount + 1 } : w));
  const out = normalizeProfile({ asOf: ASOF, slug: p.slug, nessie: n, merchants, supplemental: { bills: p.bills, loans: p.loans, retirement401kCents: 1, creditLimitCents: 1, grossPayCents: 1 } });
  assert.ok(out.issues.some((i) => i.includes('unclassified withdrawal')));
  assert.ok(out.issues.some((i) => i.includes('does not match last payment')));
});

test('supplemental investment holdings are labeled synthetic accounts; the 401(k) and Nessie accounts are unchanged', () => {
  for (const p of PROFILES) {
    const out = normalizeProfile({
      asOf: ASOF, slug: p.slug, nessie: fakeNessie(buildPlan(p)), merchants,
      supplemental: { bills: p.bills, loans: p.loans.map((l) => ({ name: l.name, day: l.day, rateBps: l.rateBps })), retirement401kCents: p.supplemental.retirement401kCents, investments: p.supplemental.investments, creditLimitCents: p.card.limit * 100, grossPayCents: p.pay.gross * 100 },
    });
    assert.deepEqual(out.issues, [], p.slug);
    const k401 = out.accounts.find((a) => a.externalId === `${p.slug}:401k`);
    assert.equal(k401.balanceCents, p.supplemental.retirement401kCents, p.slug);
    assert.equal(out.accounts.filter((a) => a.source === 'nessie').length, 3, p.slug);
    const holdings = out.accounts.filter((a) => ['cd', 'investment'].includes(a.type));
    assert.equal(holdings.length, p.supplemental.investments.length, p.slug);
    for (const h of holdings) {
      assert.equal(h.source, 'supplemental_synthetic');
      assert.match(h.externalId, new RegExp(`^${p.slug}:`));
      assert.ok(Number.isInteger(h.balanceCents) && h.balanceCents > 0);
      if (h.type === 'cd') assert.match(h.maturityDate, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
  // Older callers that omit `investments` still work (no extra accounts).
  const p = PROFILES[0];
  assert.equal(run(p).accounts.filter((a) => ['cd', 'investment'].includes(a.type)).length, 0);
});
