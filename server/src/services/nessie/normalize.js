// Pure: raw Nessie lists + supplemental facts -> our normalized documents (docs/engineering.md sections 3 and 6).
// Documents reference each other by externalId; the sync script resolves them to Mongo ObjectIds.
import { occurrences, toDay, toIso } from '../../engine/forecast.js';

const cents = (dollars) => Math.round(Number(dollars) * 100);
const at = (date) => new Date(`${date}T12:00:00Z`); // noon UTC so the calendar day survives any timezone
const ACCOUNT_TYPE = { Checking: 'checking', Savings: 'savings', 'Credit Card': 'credit_card' };
const MERCHANT_CATEGORY = { groceries: 'groceries', transport: 'transport', dining: 'other', entertainment: 'entertainment' };
const pad = (n) => String(n).padStart(2, '0');

// First scheduled date strictly after asOf for a monthly day-of-month (day <= 28).
export const nextMonthly = (asOf, day) => toIso(occurrences({ frequency: 'monthly', nextDate: `${asOf.slice(0, 8)}${pad(day)}` }, toDay(asOf), Infinity).next().value);
const nextFrom = (freq, lastDate, asOf) => toIso(occurrences({ frequency: freq, nextDate: lastDate }, toDay(asOf), Infinity).next().value);
const latest = (list, dateKey) => [...list].sort((a, b) => a[dateKey].localeCompare(b[dateKey])).at(-1);

export function normalizeProfile({ asOf, slug, nessie, supplemental, merchants }) {
  const issues = []; // anything in here must stop the sync before any DB write
  const checking = nessie.accounts.find((a) => a.type === 'Checking');
  const card = nessie.accounts.find((a) => a.type === 'Credit Card');
  if (!checking || !card) issues.push('missing checking or credit card account');

  const accounts = nessie.accounts.map((a) => ({
    externalId: a._id, source: 'nessie', name: a.nickname, type: ACCOUNT_TYPE[a.type], balanceCents: cents(a.balance),
    creditLimitCents: a.type === 'Credit Card' ? supplemental.creditLimitCents : null, // supplemental: Nessie has no limit
    asOf: at(asOf),
  }));
  accounts.push({ externalId: `${slug}:401k`, source: 'supplemental_synthetic', name: '401(k)', type: 'retirement', balanceCents: supplemental.retirement401kCents, creditLimitCents: null, asOf: at(asOf) });

  const billCategory = Object.fromEntries(supplemental.bills.map((b) => [b.nickname, b.category]));
  const tx = [];
  const push = (t) => tx.push({ source: 'nessie', transferGroupId: null, isRecurringCandidate: false, merchantName: '', ...t });

  for (const d of nessie.deposits) {
    if (d.description !== 'Payroll deposit') { issues.push(`unclassified deposit: ${d.description}`); continue; }
    push({ externalId: d._id, accountExternalId: checking._id, occurredAt: at(d.transaction_date), description: d.description, amountCents: cents(d.amount), cashflowKind: 'income', cashImpactCents: cents(d.amount), category: 'income', isRecurringCandidate: true });
  }
  for (const w of nessie.withdrawals) {
    const base = { externalId: w._id, accountExternalId: checking._id, occurredAt: at(w.transaction_date), description: w.description, amountCents: cents(w.amount), cashImpactCents: -cents(w.amount), isRecurringCandidate: true };
    if (w.description.startsWith('Bill: ')) push({ ...base, cashflowKind: 'cash_expense', category: billCategory[w.description.slice(6)] ?? 'other' });
    else if (w.description.startsWith('Loan payment: ')) push({ ...base, cashflowKind: 'loan_payment', category: 'debt' });
    else if (w.description.startsWith('Credit card payment')) push({ ...base, cashflowKind: 'credit_payment', category: 'debt' });
    else issues.push(`unclassified withdrawal: ${w.description}`);
  }
  for (const t of nessie.transfers) {
    const group = /\[grp:([^\]]+)\]/.exec(t.description)?.[1];
    if (!group) { issues.push(`transfer without [grp:] token: ${t.description}`); continue; }
    // Net combined cash effect of checking<->savings is zero.
    push({ externalId: t.id ?? t._id, accountExternalId: checking._id, occurredAt: at(t.transaction_date), description: t.description, amountCents: cents(t.amount), cashflowKind: 'internal_transfer', cashImpactCents: 0, category: 'savings', transferGroupId: group, isRecurringCandidate: true });
  }
  for (const [list, account, kind] of [[nessie.purchases, checking, 'cash_expense'], [nessie.cardPurchases, card, 'credit_purchase']]) {
    for (const p of list) {
      const m = merchants[p.merchant_id];
      if (!m) issues.push(`unknown merchant ${p.merchant_id}`);
      push({
        externalId: p._id, accountExternalId: account._id, occurredAt: at(p.purchase_date), description: p.description, merchantName: m?.name ?? '',
        amountCents: cents(p.amount), cashflowKind: kind, cashImpactCents: kind === 'cash_expense' ? -cents(p.amount) : 0, // card purchase: no cash until the card payment
        category: MERCHANT_CATEGORY[m?.key] ?? 'other',
      });
    }
  }

  // Loans: Nessie gives type/amount/monthly_payment; due day and rate are supplemental (matched by name).
  const loans = nessie.loans.map((l) => {
    const sup = supplemental.loans.find((s) => s.name === l.description);
    if (!sup) issues.push(`loan without supplemental terms: ${l.description}`);
    return {
      externalId: l._id, source: 'nessie', name: l.description, loanType: ['auto', 'mortgage', 'student', 'personal'].includes(l.type) ? l.type : 'other',
      outstandingCents: cents(l.amount), monthlyPaymentCents: cents(l.monthly_payment), dueDay: sup?.day ?? 1, annualRateBps: sup?.rateBps ?? null,
    };
  });

  const flows = [];
  const flow = (f) => flows.push({ source: 'nessie', active: true, endDate: null, grossAmountCents: null, accountExternalId: checking?._id ?? null, loanExternalId: null, ...f });

  // Income is inferred from deposits (Nessie has no income field); gross pay is supplemental.
  if (nessie.deposits.length) {
    const dates = nessie.deposits.map((d) => d.transaction_date).sort();
    const gaps = dates.slice(1).map((d, i) => toDay(d) - toDay(dates[i]));
    const frequency = gaps.length && Math.max(...gaps) <= 15 ? 'biweekly' : 'monthly';
    const last = latest(nessie.deposits, 'transaction_date');
    flow({ externalId: `payroll:${slug}`, name: 'Salary', kind: 'income', signedAmountCents: cents(last.amount), grossAmountCents: supplemental.grossPayCents, frequency, nextDate: nextFrom(frequency, last.transaction_date, asOf), category: 'income' });
  }
  for (const b of nessie.bills) {
    // nextDate comes from recurring_date + asOf, NEVER Nessie's upcoming_payment_date (real clock, not our frozen date).
    flow({ externalId: b._id, name: b.nickname, kind: 'bill', signedAmountCents: -cents(b.payment_amount), frequency: 'monthly', nextDate: nextMonthly(asOf, b.recurring_date), category: billCategory[b.nickname] ?? 'other' });
  }
  for (const l of loans) {
    const paid = latest(nessie.withdrawals.filter((w) => w.description === `Loan payment: ${l.name}`), 'transaction_date');
    if (!paid || cents(paid.amount) !== l.monthlyPaymentCents) issues.push(`loan ${l.name}: monthly payment ${l.monthlyPaymentCents} does not match last payment ${paid ? cents(paid.amount) : 'none'}`);
    flow({ externalId: `loan:${l.externalId}`, name: l.name, kind: 'loan_payment', signedAmountCents: -l.monthlyPaymentCents, frequency: 'monthly', nextDate: nextMonthly(asOf, l.dueDay), category: 'debt', loanExternalId: l.externalId });
  }
  const cardPaid = latest(nessie.withdrawals.filter((w) => w.description.startsWith('Credit card payment')), 'transaction_date');
  if (cardPaid) flow({ externalId: `cardpay:${slug}`, name: 'Credit card payment', kind: 'credit_card_payment', signedAmountCents: -cents(cardPaid.amount), frequency: 'monthly', nextDate: nextMonthly(asOf, Number(cardPaid.transaction_date.slice(8))), category: 'debt' });
  // The monthly checking->savings transfer is intentionally NOT a recurring flow: zero net cash effect.

  return { accounts, transactions: tx, loans, flows, issues };
}
