// Read-only demo profile routes + stateless evaluation (docs/engineering.md section 5). Nothing here writes to MongoDB.
import { Router } from 'express';
import DemoProfile from '../models/DemoProfile.js';
import Transaction from '../models/Transaction.js';
import { httpError } from '../middleware/errorHandler.js';
import { calcLimit, explainLimit } from '../middleware/rateLimit.js';
import { forecast } from '../engine/forecast.js';
import { emergencyCoverage, debtPaymentBurden, cashFlowSafety } from '../engine/indicators.js';
import { evaluateScenario, baselineRecommendations } from '../engine/scenarios.js';
import { explain } from '../services/explanationService.js';
import { buildOverview, fixedMonthlyCents, loadEngine, loadHistory, loadSnapshot, spendByCategory, windowStart } from '../services/snapshot.js';

const router = Router();
const CATEGORIES = Transaction.schema.path('category').enumValues;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const bad = (message, details) => httpError(400, 'VALIDATION_FAILED', message, details);

router.get('/profiles', async (_req, res) => {
  const profiles = await DemoProfile.find().sort('slug').lean();
  res.json({ profiles: profiles.map((p) => ({ id: p._id, slug: p.slug, displayName: p.displayName, lastSyncedAt: p.lastSyncedAt })) });
});

router.get('/profiles/:slug/overview', async (req, res) => res.json(buildOverview(await loadSnapshot(req.params.slug))));

router.get('/profiles/:slug/transactions', async (req, res) => {
  const { from, to, category } = req.query;
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw bad('limit must be an integer 1-100');
  for (const [k, v] of Object.entries({ from, to })) if (v !== undefined && !DAY.test(v)) throw bad(`${k} must be YYYY-MM-DD`);
  if (category !== undefined && !CATEGORIES.includes(category)) throw bad('Unknown category', { allowed: CATEGORIES });
  const { profile } = await loadSnapshot(req.params.slug);
  const q = { profileId: profile._id };
  if (from || to) q.occurredAt = { ...(from && { $gte: new Date(`${from}T00:00:00Z`) }), ...(to && { $lte: new Date(`${to}T23:59:59Z`) }) };
  if (category) q.category = category;
  const items = await Transaction.find(q).sort({ occurredAt: -1 }).limit(limit).lean();
  res.json({ items: items.map((t) => ({ id: t._id, accountId: t.accountId, occurredAt: t.occurredAt, description: t.description, merchantName: t.merchantName, amountCents: t.amountCents, cashflowKind: t.cashflowKind, cashImpactCents: t.cashImpactCents, category: t.category, source: t.source })) });
});

router.get('/profiles/:slug/spending', async (req, res) => {
  const months = req.query.months === undefined ? 3 : Number(req.query.months);
  if (!Number.isInteger(months) || months < 1 || months > 6) throw bad('months must be an integer 1-6');
  const { profile, asOf, flows } = await loadSnapshot(req.params.slug);
  const { variable } = await loadEngine(req.params.slug);
  const byCategory = spendByCategory(await loadHistory(profile, asOf, months));
  res.json({
    period: { from: windowStart(asOf, months), to: asOf, months },
    totalCents: Object.values(byCategory).reduce((a, b) => a + b, 0),
    byCategory: Object.entries(byCategory).map(([category, totalCents]) => ({ category, totalCents })).sort((a, b) => b.totalCents - a.totalCents),
    fixedMonthlyCents: fixedMonthlyCents(flows),
    variableMonthlyCents: variable.totalCents,
  });
});

router.get('/profiles/:slug/health-metrics', calcLimit, async (req, res) => {
  const e = await loadEngine(req.params.slug);
  const f = forecast(e.input);
  const months = e.settings.historyMonths;
  const spend = Object.fromEntries(Object.entries(spendByCategory(e.history)).map(([c, v]) => [c, Math.round(v / months)]));
  res.json({
    asOf: e.asOf,
    indicators: {
      emergencyCoverage: { months: emergencyCoverage({ availableCashCents: e.input.openingCashCents, monthlySpendByCategory: spend, flows: e.flows }) },
      debtPaymentBurden: { ratio: debtPaymentBurden({ flows: e.flows }) },
      cashFlowSafety: cashFlowSafety(f),
    },
    assumptions: { historyMonths: months, cashFloorCents: e.settings.cashFloorCents, forecastMethod: 'deterministic_daily_cashflow', note: 'Estimates from synthetic data; not advice or a loan decision.' },
  });
});

router.get('/profiles/:slug/forecast', calcLimit, async (req, res) => {
  const e = await loadEngine(req.params.slug);
  const f = forecast(e.input);
  res.json({ ...f, assumptions: { ...f.assumptions, historyMonths: e.settings.historyMonths, variableMonthlySpendCents: e.variable.totalCents } });
});

router.post('/profiles/:slug/scenarios/evaluate', calcLimit, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw bad('Body must be a scenario object');
  res.json(evaluateScenario((await loadEngine(req.params.slug)).input, req.body));
});

router.get('/profiles/:slug/recommendations', calcLimit, async (req, res) => {
  res.json({ recommendations: baselineRecommendations((await loadEngine(req.params.slug)).input) });
});

router.post('/profiles/:slug/explanations', explainLimit, async (req, res) => {
  const { subject, scenario } = req.body ?? {};
  if (!['forecast', 'scenario'].includes(subject)) throw bad('subject must be "forecast" or "scenario"');
  const e = await loadEngine(req.params.slug);
  const assumptions = [`Deterministic daily cash-flow forecast from ${e.asOf}`, `Spending estimated from the last ${e.settings.historyMonths} months`];
  let facts;
  if (subject === 'forecast') {
    const f = forecast(e.input);
    facts = { asOf: f.asOf, cashFloorCents: e.settings.cashFloorCents, checkpoints: f.checkpoints, firstShortfallDate: f.shortfalls[0]?.date ?? null, daysBelowFloor: f.shortfalls.length, minCashCents: cashFlowSafety(f).minCashCents };
  } else {
    if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) throw bad('scenario must be an object');
    const r = evaluateScenario(e.input, scenario);
    facts = { name: scenario.name ?? scenario.type, deltas: r.deltas, firstShortfallDate: r.assessment.firstShortfallDate, baselineFirstShortfallDate: r.baseline.shortfalls[0]?.date ?? null, topRecommendation: r.recommendations[0] ?? null };
  }
  res.json(await explain({ subject, facts, assumptions }));
});

export default router;
