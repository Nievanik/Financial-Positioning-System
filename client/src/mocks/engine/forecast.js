// MOCK-ONLY COPY of server/src/engine/forecast.js (origin/dev 8eb9c93), used only in mock mode so
// what-if results match the live engine exactly. The server copy is the source of truth; keep in sync.
// Deterministic daily cash-flow forecast (docs/engineering.md section 4). Pure: no I/O, integer cents.
// Loans are NOT an input: each loan payment lives once in `flows` as kind `loan_payment`.
const DAY = 86400000;
const STEP = { weekly: 7, biweekly: 14 };

const parse = (s) => s.split('-').map(Number); // 'YYYY-MM-DD' -> [y, m, d]
export const toDay = (s) => { const [y, m, d] = parse(s); return Date.UTC(y, m - 1, d) / DAY; };
export const toIso = (day) => new Date(day * DAY).toISOString().slice(0, 10);
const monthEnd = (y, m) => Date.UTC(y, m, 0) / DAY; // m is 1-based; overflow rolls into later years

export function* occurrences(flow, from, to) {
  const [y, m, d] = parse(flow.nextDate);
  const first = toDay(flow.nextDate);
  const last = flow.endDate ? toDay(flow.endDate) : Infinity;
  if (flow.frequency !== 'monthly' && !STEP[flow.frequency]) throw new Error(`Unknown frequency: ${flow.frequency}`);
  for (let i = 0; ; i++) {
    const day = flow.frequency === 'monthly'
      ? Math.min(Date.UTC(y, m - 1 + i, d) / DAY, monthEnd(y, m + i))
      : first + i * STEP[flow.frequency];
    if (day > to || day > last) return;
    if (day > from) yield day;
  }
}

export function forecast({ asOf, openingCashCents, flows, variableMonthlySpendCents = 0, cashFloorCents = 0 }) {
  for (const n of [openingCashCents, variableMonthlySpendCents, cashFloorCents, ...flows.map((f) => f.signedAmountCents)]) {
    if (!Number.isInteger(n)) throw new Error('Money must be integer cents');
  }
  const start = toDay(asOf);
  const [y, m] = parse(asOf);
  // Month 1 = first month-end strictly after asOf.
  const firstEnd = monthEnd(y, m) > start ? [y, m] : [y, m + 1];
  const checkpointDays = [1, 2, 3, 6].map((k) => ({ month: k, day: monthEnd(firstEnd[0], firstEnd[1] + k - 1) }));
  const end = checkpointDays[3].day;

  const delta = new Map();
  const add = (day, cents) => delta.set(day, (delta.get(day) || 0) + cents);
  for (const f of flows) {
    if (f.active === false) continue;
    for (const day of occurrences(f, start, end)) add(day, f.signedAmountCents);
  }
  const weekly = Math.round((variableMonthlySpendCents * 12) / 52);
  if (weekly) for (let day = start + 7; day <= end; day += 7) add(day, -weekly);

  const daily = [];
  const shortfalls = [];
  const balanceOn = new Map();
  let cash = openingCashCents;
  for (let day = start; day <= end; day++) {
    cash += delta.get(day) || 0;
    balanceOn.set(day, cash);
    daily.push({ date: toIso(day), cashCents: cash });
    if (cash < cashFloorCents) shortfalls.push({ date: toIso(day), cashCents: cash });
  }

  return {
    asOf,
    currency: 'USD',
    checkpoints: checkpointDays.map(({ month, day }) => ({ month, date: toIso(day), cashCents: balanceOn.get(day) })),
    daily,
    shortfalls,
    assumptions: { cashFloorCents, forecastMethod: 'deterministic_daily_cashflow', variableExpenseFrequency: 'weekly' },
  };
}
