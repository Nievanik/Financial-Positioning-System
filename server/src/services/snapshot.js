// Loads a demo profile's stored snapshot and turns it into engine inputs / API payloads.
// DB access is in loadSnapshot/loadHistory only; everything else is pure (tested without Mongo).
import DemoProfile from '../models/DemoProfile.js';
import Account from '../models/Account.js';
import Loan from '../models/Loan.js';
import RecurringCashFlow from '../models/RecurringCashFlow.js';
import Transaction from '../models/Transaction.js';
import { httpError } from '../middleware/errorHandler.js';
import { monthly } from '../engine/indicators.js';

const SPEND_KINDS = ['cash_expense', 'credit_purchase']; // merchant/expense spending; excludes transfers, debt repayments, income
const FIXED_KINDS = ['bill', 'loan_payment', 'credit_card_payment'];

export async function loadSnapshot(slug) {
  const profile = await DemoProfile.findOne({ slug: String(slug) }).lean();
  if (!profile) throw httpError(404, 'PROFILE_NOT_FOUND', 'Unknown demo profile');
  const q = { profileId: profile._id };
  const [accounts, loans, flows] = await Promise.all([Account.find(q).lean(), Loan.find(q).lean(), RecurringCashFlow.find({ ...q, active: true }).lean()]);
  return { profile, asOf: profile.forecastSettings.asOfDate, accounts, loans, flows };
}

export const windowStart = (asOf, months) => {
  const d = new Date(`${asOf}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
};

// Transactions in (asOf - months, asOf]; occurredAt is stored at 12:00 UTC.
export const loadHistory = (profile, asOf, months) => Transaction.find({
  profileId: profile._id, occurredAt: { $gt: new Date(`${windowStart(asOf, months)}T12:00:00Z`), $lte: new Date(`${asOf}T23:59:59Z`) },
}).lean();

// Total spend per category over the window (bills included; debt repayments, transfers and income excluded).
export function spendByCategory(txs) {
  const out = {};
  for (const t of txs) if (SPEND_KINDS.includes(t.cashflowKind)) out[t.category] = (out[t.category] || 0) + t.amountCents;
  return out;
}

// Variable (non-scheduled) monthly spend: recurring-candidate rows are already modelled as flows, so skip them.
export function variableMonthlySpend(txs, { historyMonths, categoryOverridesCents = {} }) {
  const total = {};
  for (const t of txs) if (SPEND_KINDS.includes(t.cashflowKind) && !t.isRecurringCandidate) total[t.category] = (total[t.category] || 0) + t.amountCents;
  const byCategory = Object.fromEntries(Object.entries(total).map(([c, v]) => [c, Math.round(v / historyMonths)]));
  Object.assign(byCategory, categoryOverridesCents); // overrides replace the estimate for that category
  return { byCategory, totalCents: Object.values(byCategory).reduce((a, b) => a + b, 0) };
}

export const availableCashCents = (accounts) => accounts.filter((a) => ['checking', 'savings'].includes(a.type)).reduce((s, a) => s + a.balanceCents, 0);

export async function loadEngine(slug) {
  const snap = await loadSnapshot(slug);
  const settings = snap.profile.forecastSettings;
  const history = await loadHistory(snap.profile, snap.asOf, settings.historyMonths);
  const variable = variableMonthlySpend(history, settings);
  return {
    ...snap, history, settings, variable,
    input: { asOf: snap.asOf, openingCashCents: availableCashCents(snap.accounts), flows: snap.flows, variableMonthlySpendCents: variable.totalCents, cashFloorCents: settings.cashFloorCents },
  };
}

export function buildOverview({ profile, asOf, accounts, loans, flows }) {
  const sum = (types) => accounts.filter((a) => types.includes(a.type)).reduce((s, a) => s + a.balanceCents, 0);
  const cards = accounts.filter((a) => a.type === 'credit_card');
  const creditCardDebtCents = sum(['credit_card']);
  const loanDebtCents = loans.reduce((s, l) => s + l.outstandingCents, 0);
  const creditLimitCents = cards.reduce((s, a) => s + (a.creditLimitCents || 0), 0);
  const assets = sum(['checking', 'savings', 'retirement', 'cd', 'investment']);
  return {
    profile: { slug: profile.slug, displayName: profile.displayName, currency: profile.currency, timeZone: profile.timeZone, lastSyncedAt: profile.lastSyncedAt },
    asOf,
    cash: { availableCents: sum(['checking', 'savings']), checkingCents: sum(['checking']), savingsCents: sum(['savings']) }, // retirement/CDs/credit limits are never cash
    totals: { retirementAndInvestmentsCents: sum(['retirement', 'cd', 'investment']), creditCardDebtCents, loanDebtCents, creditLimitCents, unusedCreditCents: creditLimitCents - creditCardDebtCents, netWorthCents: assets - creditCardDebtCents - loanDebtCents },
    accounts: accounts.map((a) => ({ id: a._id, name: a.name, type: a.type, balanceCents: a.balanceCents, creditLimitCents: a.creditLimitCents, source: a.source, riskLevel: a.riskLevel ?? null, annualRateBps: a.annualRateBps ?? null, maturityDate: a.maturityDate ?? null, holdingsNote: a.holdingsNote ?? null })),
    loans: loans.map((l) => ({ id: l._id, name: l.name, loanType: l.loanType, outstandingCents: l.outstandingCents, monthlyPaymentCents: l.monthlyPaymentCents, dueDay: l.dueDay, annualRateBps: l.annualRateBps, source: l.source })),
    income: flows.filter((f) => f.kind === 'income').map((f) => ({ name: f.name, amountCents: f.signedAmountCents, grossAmountCents: f.grossAmountCents ?? null, frequency: f.frequency, nextDate: f.nextDate })).sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
    obligations: flows.filter((f) => f.signedAmountCents < 0).map((f) => ({ name: f.name, kind: f.kind, amountCents: -f.signedAmountCents, frequency: f.frequency, nextDate: f.nextDate, category: f.category, loanId: f.loanId ?? null })).sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
  };
}

export const fixedMonthlyCents = (flows) => flows.filter((f) => FIXED_KINDS.includes(f.kind)).reduce((s, f) => s + monthly(f, -f.signedAmountCents), 0);

// Net take-home income per month from active income flows (same normalisation as the indicators).
export const incomeMonthlyCents = (flows) => flows.filter((f) => f.kind === 'income').reduce((s, f) => s + monthly(f, f.signedAmountCents), 0);
