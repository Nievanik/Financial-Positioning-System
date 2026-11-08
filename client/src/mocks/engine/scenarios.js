// MOCK-ONLY COPY of server/src/engine/scenarios.js (feature/sabik-investments-integration), used only in mock mode so
// what-if results match the live engine exactly. The server copy is the source of truth; keep in sync.
// What-if comparison (docs/engineering.md section 4, rule 5). Pure: clones the baseline input, adds
// scenario flows, reruns forecast(). Nothing is persisted.
import { forecast } from './forecast.js';

const TYPES = ['one_time', 'down_payment_recurring', 'monthly_spending_reduction'];

const invalid = (message) => Object.assign(new Error(message), { status: 422, code: 'INVALID_SCENARIO' });
const posInt = (v, name) => { if (!Number.isInteger(v) || v <= 0) throw invalid(`${name} must be a positive integer (cents)`); };
// Last day of the month containing the n-th monthly occurrence (1-based) counted from startDate.
const lastOccurrenceMonthEnd = (startDate, n) => {
  const [y, m] = startDate.split('-').map(Number);
  return new Date(Date.UTC(y, m + n - 1, 0)).toISOString().slice(0, 10);
};

function scenarioFlows(s) {
  const base = { active: true, frequency: 'monthly', nextDate: s.startDate };
  const once = (signedAmountCents) => ({ ...base, name: s.name, signedAmountCents, endDate: s.startDate });
  const months = (signedAmountCents) => ({
    ...base, name: s.name, signedAmountCents, endDate: lastOccurrenceMonthEnd(s.startDate, s.durationMonths),
  });
  if (s.type === 'one_time') return [once(-s.amountCents)];
  if (s.type === 'down_payment_recurring') return [once(-s.downPaymentCents), months(-s.monthlyAmountCents)];
  return [months(s.monthlyAmountCents)]; // monthly_spending_reduction: cash freed up
}

function validate(s, asOf) {
  if (!TYPES.includes(s?.type)) throw invalid('Unknown scenario type');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.startDate || '') || s.startDate <= asOf) throw invalid('startDate must be a date after asOf');
  if (s.type === 'one_time') posInt(s.amountCents, 'amountCents');
  else {
    posInt(s.monthlyAmountCents, 'monthlyAmountCents');
    if (!Number.isInteger(s.durationMonths) || s.durationMonths < 1 || s.durationMonths > 6) throw invalid('durationMonths must be 1-6');
    if (s.type === 'down_payment_recurring') posInt(s.downPaymentCents, 'downPaymentCents');
  }
}

const run = (input, ...scenarios) => forecast({ ...input, flows: [...input.flows, ...scenarios.flatMap(scenarioFlows)] });
const minCash = (f) => Math.min(...f.daily.map((d) => d.cashCents));
const addMonths = (date, n) => {
  const [y, m, d] = date.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))).toISOString().slice(0, 10);
};

// Each suggestion is re-simulated; impacts are vs the evaluated scenario and only helpful ones are returned.
// `scenario` is the exact request body for POST /scenarios/evaluate that tries the suggestion on its own, or
// null when the suggestion only applies on top of the evaluated scenario (evaluate accepts one scenario).
function recommend(input, scenario, current) {
  const nextMonth = addMonths(`${input.asOf.slice(0, 8)}01`, 1);
  const options = [];
  if (scenario.type !== 'monthly_spending_reduction') {
    const delayed = { ...scenario, startDate: addMonths(scenario.startDate, 1) };
    options.push({
      id: 'delay_one_month',
      title: 'Delay by one month',
      action: `Start on ${delayed.startDate} instead of ${scenario.startDate}`,
      // Scenario dates must stay inside the forecast horizon (engineering.md 3.2), so only offer it as a
      // standalone request when the delayed start is on/before the month-6 checkpoint.
      scenario: delayed.startDate <= current.checkpoints[3].date ? delayed : null,
      result: run(input, delayed),
    });
  }
  const cut = { type: 'monthly_spending_reduction', name: 'Cut discretionary spending', monthlyAmountCents: 10000, startDate: nextMonth, durationMonths: 6 };
  options.push({
    id: 'cut_discretionary',
    title: 'Cut discretionary spending by $100/month',
    action: `Spend $100 less per month from ${nextMonth}`,
    scenario: null, // combined with the evaluated scenario, so not a standalone request
    result: run(input, scenario, cut),
  });
  return quantify(options, current);
}

// Impacts are re-simulated numbers vs `current`; options that help neither month 6 nor the lowest cash point are dropped.
function quantify(options, current) {
  return options
    .map(({ result, ...o }) => ({
      ...o,
      impactMonth6Cents: result.checkpoints[3].cashCents - current.checkpoints[3].cashCents,
      impactMinimumCashCents: minCash(result) - minCash(current),
      explanation: 'Computed by re-running the deterministic forecast with this change.',
      assumptions: ['Same baseline flows and variable-spend estimate', 'Impacts are measured against the evaluated scenario'],
    }))
    .filter((r) => r.impactMonth6Cents > 0 || r.impactMinimumCashCents > 0);
}

// Next-best actions against the baseline (no scenario): spend $100 or $250 less per month from next month.
export function baselineRecommendations(input) {
  const current = forecast(input);
  const start = addMonths(`${input.asOf.slice(0, 8)}01`, 1);
  return quantify([10000, 25000].map((amount) => {
    const scenario = { type: 'monthly_spending_reduction', name: 'Cut discretionary spending', monthlyAmountCents: amount, startDate: start, durationMonths: 6 };
    return {
      id: `cut_${amount / 100}`,
      title: `Cut discretionary spending by $${amount / 100}/month`,
      action: `Spend $${amount / 100} less per month from ${start}`,
      scenario, // standalone request for POST /scenarios/evaluate (the UI's "Try it")
      result: run(input, scenario),
    };
  }), current);
}

export function evaluateScenario(input, scenario) {
  validate(scenario, input.asOf);
  const baseline = forecast(input);
  const result = run(input, scenario);
  const [m1, m2, m3, m6] = result.checkpoints.map((c, i) => c.cashCents - baseline.checkpoints[i].cashCents);
  const first = result.shortfalls[0]?.date ?? null;
  return {
    baseline,
    scenario: result,
    deltas: { month1Cents: m1, month2Cents: m2, month3Cents: m3, month6Cents: m6 },
    assessment: {
      riskLevel: first ? 'shortfall' : 'ok',
      firstShortfallDate: first,
      reasons: first && !baseline.shortfalls.length ? ['Scenario causes a cash shortfall the baseline does not have'] : [],
    },
    recommendations: recommend(input, scenario, result),
  };
}
