// Pure body validators for the profile-editing routes (docs/engineering.md section 5.4).
// Each returns the exact fields to write, so routes never spread client input into Mongo.
import { httpError } from '../middleware/errorHandler.js';
import { nextMonthly } from './nessie/normalize.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CENTS = 100_000_000_00; // $100M: a typo guard, not a business rule
export const FLOW_KINDS = ['income', 'bill', 'credit_card_payment', 'savings_contribution', 'retirement_contribution']; // loan_payment is owned by loans
export const FREQUENCIES = ['weekly', 'biweekly', 'monthly'];
export const LOAN_TYPES = ['auto', 'mortgage', 'student', 'personal', 'other'];

const bad = (message) => httpError(400, 'VALIDATION_FAILED', message);
const obj = (b) => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw bad('Body must be an object');
  return b;
};
const name = (v) => {
  if (typeof v !== 'string' || !v.trim() || v.length > 60) throw bad('name must be 1-60 characters');
  return v.trim();
};
const cents = (v, field, { min = 0 } = {}) => {
  if (!Number.isInteger(v) || v < min || v > MAX_CENTS) throw bad(`${field} must be whole cents >= ${min}`);
  return v;
};
const oneOf = (v, field, list) => {
  if (!list.includes(v)) throw bad(`${field} must be one of ${list.join(', ')}`);
  return v;
};
const isDay = (v) => typeof v === 'string' && DAY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

export function parseAccount(body, type) {
  const b = obj(body);
  const out = { name: name(b.name), balanceCents: cents(b.balanceCents, 'balanceCents') };
  if (type === 'credit_card') out.creditLimitCents = b.creditLimitCents == null ? null : cents(b.creditLimitCents, 'creditLimitCents');
  else if (b.creditLimitCents != null) throw bad('creditLimitCents only applies to credit cards');
  return out;
}

export function parseFlow(body, { asOf, categories }) {
  const b = obj(body);
  const kind = oneOf(b.kind, 'kind', FLOW_KINDS);
  const amount = cents(b.amountCents, 'amountCents', { min: 1 });
  if (!isDay(b.nextDate) || b.nextDate <= asOf) throw bad(`nextDate must be a YYYY-MM-DD date after ${asOf}`);
  if (b.endDate != null && (!isDay(b.endDate) || b.endDate < b.nextDate)) throw bad('endDate must be a YYYY-MM-DD date on or after nextDate');
  return {
    name: name(b.name),
    kind,
    signedAmountCents: kind === 'income' ? amount : -amount,
    grossAmountCents: null, // only seeded payroll has a gross figure; a hand-edited net amount would make it stale
    frequency: oneOf(b.frequency, 'frequency', FREQUENCIES),
    nextDate: b.nextDate,
    endDate: b.endDate ?? null,
    category: kind === 'income' ? 'income' : oneOf(b.category ?? 'other', 'category', categories),
  };
}

// Returns the loan fields and its one loan_payment flow (the only place the payment is counted).
export function parseLoan(body, { asOf }) {
  const b = obj(body);
  if (!Number.isInteger(b.dueDay) || b.dueDay < 1 || b.dueDay > 28) throw bad('dueDay must be an integer 1-28');
  if (b.annualRateBps != null && (!Number.isInteger(b.annualRateBps) || b.annualRateBps < 0 || b.annualRateBps > 10000)) throw bad('annualRateBps must be an integer 0-10000');
  const loan = {
    name: name(b.name),
    loanType: oneOf(b.loanType, 'loanType', LOAN_TYPES),
    outstandingCents: cents(b.outstandingCents, 'outstandingCents'),
    monthlyPaymentCents: cents(b.monthlyPaymentCents, 'monthlyPaymentCents', { min: 1 }),
    dueDay: b.dueDay,
    annualRateBps: b.annualRateBps ?? null,
  };
  const flow = { name: loan.name, kind: 'loan_payment', signedAmountCents: -loan.monthlyPaymentCents, frequency: 'monthly', nextDate: nextMonthly(asOf, loan.dueDay), category: 'debt' };
  return { loan, flow };
}

// Monthly variable-spend estimates per category; replaces the whole map.
export function parseOverrides(body, categories) {
  const map = obj(obj(body).categoryOverridesCents);
  return Object.fromEntries(Object.entries(map).map(([c, v]) => [oneOf(c, 'category', categories), cents(v, `categoryOverridesCents.${c}`)]));
}
