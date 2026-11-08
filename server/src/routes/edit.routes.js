// Profile editing (docs/engineering.md section 5.4). No login: anyone can change a profile's inputs.
import { Router } from 'express';
import mongoose from 'mongoose';
import DemoProfile from '../models/DemoProfile.js';
import Account from '../models/Account.js';
import Loan from '../models/Loan.js';
import RecurringCashFlow from '../models/RecurringCashFlow.js';
import Transaction from '../models/Transaction.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeLimit } from '../middleware/rateLimit.js';
import { loadSnapshot } from '../services/snapshot.js';
import { parseAccount, parseFlow, parseLoan, parseOverrides } from '../services/edits.js';

const router = Router();
const CATEGORIES = Transaction.schema.path('category').enumValues.filter((c) => c !== 'income');
// Spending estimates exclude debt/savings: those are flows already, an estimate would count them twice.
const SPEND_CATEGORIES = CATEGORIES.filter((c) => !['debt', 'savings'].includes(c));
const USER = { source: 'user_entered', externalId: null, active: true };

// Profile-scoped lookup: an id from another profile is treated as unknown.
async function own(Model, profile, id, extra = {}) {
  const doc = mongoose.isValidObjectId(id) && (await Model.findOne({ _id: id, profileId: profile._id, ...extra }));
  if (!doc) throw httpError(404, 'NOT_FOUND', `${Model.modelName} not found`);
  return doc;
}

router.get('/profiles/:slug/editable', async (req, res) => {
  const { profile, asOf, accounts, loans, flows } = await loadSnapshot(req.params.slug);
  res.json({
    asOf,
    accounts: accounts.map((a) => ({ id: a._id, name: a.name, type: a.type, balanceCents: a.balanceCents, creditLimitCents: a.creditLimitCents, source: a.source })),
    flows: flows.filter((f) => f.kind !== 'loan_payment').map((f) => ({ id: f._id, name: f.name, kind: f.kind, amountCents: Math.abs(f.signedAmountCents), frequency: f.frequency, nextDate: f.nextDate, endDate: f.endDate, category: f.category, source: f.source })),
    loans: loans.map((l) => ({ id: l._id, name: l.name, loanType: l.loanType, outstandingCents: l.outstandingCents, monthlyPaymentCents: l.monthlyPaymentCents, dueDay: l.dueDay, annualRateBps: l.annualRateBps, source: l.source })),
    categoryOverridesCents: Object.fromEntries(Object.entries(profile.forecastSettings.categoryOverridesCents ?? {})),
    categories: CATEGORIES,
    spendCategories: SPEND_CATEGORIES,
  });
});

router.put('/profiles/:slug/accounts/:id', writeLimit, async (req, res) => {
  const { profile } = await loadSnapshot(req.params.slug);
  const acc = await own(Account, profile, req.params.id);
  await acc.set(parseAccount(req.body, acc.type)).save();
  res.json({ id: acc._id });
});

router.post('/profiles/:slug/flows', writeLimit, async (req, res) => {
  const { profile, asOf } = await loadSnapshot(req.params.slug);
  const flow = await RecurringCashFlow.create({ ...parseFlow(req.body, { asOf, categories: CATEGORIES }), ...USER, profileId: profile._id });
  res.status(201).json({ id: flow._id });
});

router.put('/profiles/:slug/flows/:id', writeLimit, async (req, res) => {
  const { profile, asOf } = await loadSnapshot(req.params.slug);
  const flow = await own(RecurringCashFlow, profile, req.params.id, { kind: { $ne: 'loan_payment' } });
  await flow.set(parseFlow(req.body, { asOf, categories: CATEGORIES })).save();
  res.json({ id: flow._id });
});

router.delete('/profiles/:slug/flows/:id', writeLimit, async (req, res) => {
  const { profile } = await loadSnapshot(req.params.slug);
  await (await own(RecurringCashFlow, profile, req.params.id, { kind: { $ne: 'loan_payment' } })).deleteOne();
  res.status(204).end();
});

router.post('/profiles/:slug/loans', writeLimit, async (req, res) => {
  const { profile, asOf } = await loadSnapshot(req.params.slug);
  const { loan, flow } = parseLoan(req.body, { asOf });
  const doc = await Loan.create({ ...loan, source: 'user_entered', externalId: null, profileId: profile._id });
  await RecurringCashFlow.create({ ...flow, ...USER, profileId: profile._id, loanId: doc._id });
  res.status(201).json({ id: doc._id });
});

router.put('/profiles/:slug/loans/:id', writeLimit, async (req, res) => {
  const { profile, asOf } = await loadSnapshot(req.params.slug);
  const doc = await own(Loan, profile, req.params.id);
  const { loan, flow } = parseLoan(req.body, { asOf });
  await doc.set(loan).save();
  // Keep exactly one payment flow per loan (create it if the loan never had one).
  const existing = await RecurringCashFlow.findOne({ profileId: profile._id, loanId: doc._id, kind: 'loan_payment' });
  if (existing) await existing.set({ ...flow, active: true }).save();
  else await RecurringCashFlow.create({ ...flow, ...USER, profileId: profile._id, loanId: doc._id });
  res.json({ id: doc._id });
});

router.delete('/profiles/:slug/loans/:id', writeLimit, async (req, res) => {
  const { profile } = await loadSnapshot(req.params.slug);
  const doc = await own(Loan, profile, req.params.id);
  await RecurringCashFlow.deleteMany({ profileId: profile._id, loanId: doc._id });
  await doc.deleteOne();
  res.status(204).end();
});

router.put('/profiles/:slug/spending-estimates', writeLimit, async (req, res) => {
  const { profile } = await loadSnapshot(req.params.slug);
  const categoryOverridesCents = parseOverrides(req.body, SPEND_CATEGORIES);
  await DemoProfile.updateOne({ _id: profile._id }, { $set: { 'forecastSettings.categoryOverridesCents': categoryOverridesCents } });
  res.json({ categoryOverridesCents });
});

export default router;
