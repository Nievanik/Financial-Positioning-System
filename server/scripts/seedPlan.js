// Pure builder: demo profile spec -> Nessie records + engine inputs. No network, no DB (testable offline).
import { ASOF, HISTORY_DAYS, MERCHANTS } from './demoData.js';
import { toDay, toIso, occurrences, forecast } from '../src/engine/forecast.js';
import { emergencyCoverage, debtPaymentBurden, cashFlowSafety } from '../src/engine/indicators.js';

const PATTERN = [0.9, 1.05, 1.0, 1.1, 0.95]; // deterministic "noise"; never use Math.random (reproducible demo)
const pad = (n) => String(n).padStart(2, '0');
const asOfDay = toDay(ASOF);
const fromDay = asOfDay - HISTORY_DAYS;

// Schedule start safely BEFORE the history window so occurrences() yields every past date.
// Monthly days must be <= 28 (no clipping surprises in back-dated history).
const startOf = (freq, anchorOrDay) => (freq === 'monthly'
  ? `2026-06-${pad(typeof anchorOrDay === 'number' ? anchorOrDay : Number(anchorOrDay.slice(8)))}`
  : toIso(toDay(anchorOrDay) - 14 * 10));
const past = (freq, start) => [...occurrences({ frequency: freq, nextDate: start }, fromDay, asOfDay)].map(toIso); // dates <= asOf
const nextAfter = (freq, start) => toIso(occurrences({ frequency: freq, nextDate: start }, asOfDay, Infinity).next().value);

// Purchases every `every` days walking back from asOf-offset; amount scales with the monthly target.
function spendDates(every, offset) {
  const out = [];
  for (let d = asOfDay - offset; d > fromDay; d -= every) out.push(toIso(d));
  return out.reverse();
}
const amountFor = (monthly, every, i) => Math.max(1, Math.round(((monthly * 12) / 365) * every * PATTERN[i % PATTERN.length]));

export function buildPlan(p) {
  const records = [];
  const add = (account, resource, body) => records.push({ account, resource, body });
  const flows = [];
  const dollars = (n) => n * 100;

  // income
  const payStart = startOf(p.pay.frequency, p.pay.anchor);
  for (const date of past(p.pay.frequency, payStart)) {
    add('checking', 'deposits', { medium: 'balance', transaction_date: date, status: 'completed', amount: p.pay.net, description: 'Payroll deposit' });
  }
  flows.push({ name: 'Salary', kind: 'income', signedAmountCents: dollars(p.pay.net), grossAmountCents: dollars(p.pay.gross), frequency: p.pay.frequency, nextDate: nextAfter(p.pay.frequency, payStart), category: 'income' });

  // monthly obligations: bills, loan payments, card payment
  const monthly = (name, day, amount, kind, category, historyDesc) => {
    const start = startOf('monthly', day);
    const dates = past('monthly', start);
    for (const date of dates) add('checking', 'withdrawals', { medium: 'balance', transaction_date: date, status: 'completed', amount, description: historyDesc });
    flows.push({ name, kind, signedAmountCents: -dollars(amount), frequency: 'monthly', nextDate: nextAfter('monthly', start), category });
    return dates.at(-1);
  };
  for (const b of p.bills) {
    const last = monthly(b.nickname, b.day, b.amount, 'bill', b.category, `Bill: ${b.nickname}`);
    add('checking', 'bills', { status: 'recurring', payee: b.payee, nickname: b.nickname, payment_date: last, recurring_date: b.day, payment_amount: b.amount });
  }
  for (const l of p.loans) {
    monthly(l.name, l.day, l.payment, 'loan_payment', 'debt', `Loan payment: ${l.name}`);
    // Loans are posted on the checking account; GET /accounts/{id}/loans has no account id, so sync reads loans from checking only.
    add('checking', 'loans', { type: l.type, status: 'approved', credit_score: l.creditScore, monthly_payment: l.payment, amount: l.outstanding, description: l.name });
  }
  monthly('Credit card payment', p.cardPayment.day, p.cardPayment.amount, 'credit_card_payment', 'debt', 'Credit card payment [card]');

  // checking -> savings transfer: history only. Net cash effect is zero, so it is NOT an engine flow.
  for (const date of past('monthly', startOf('monthly', p.savingsTransfer.day))) {
    add('checking', 'transfers', { status: 'completed', amount: p.savingsTransfer.amount, transaction_date: date, description: `Transfer to Savings [grp:${p.slug}-${date}]` });
  }

  // variable spending history (card purchases carry no cash impact until the card payment)
  const streams = [
    ['checking', 'groceries', 7, 2], ['checking', 'transport', 14, 4], ['card', 'dining', 5, 1], ['card', 'entertainment', 9, 3],
  ];
  for (const [account, key, every, offset] of streams) {
    spendDates(every, offset).forEach((date, i) => add(account, 'purchases', {
      merchant_id: MERCHANTS[key].id, medium: 'balance', purchase_date: date, status: 'completed',
      amount: amountFor(p.spend[key], every, i), description: MERCHANTS[key].name,
    }));
  }

  const billCat = (c) => p.bills.filter((b) => b.category === c).reduce((s, b) => s + dollars(b.amount), 0);
  return {
    slug: p.slug,
    customer: { first_name: p.first, last_name: p.last, address: { street_number: '100', street_name: 'Demo Ave', city: 'Dallas', state: 'TX', zip: '75201' } },
    accounts: {
      checking: { type: 'Checking', nickname: `${p.first}'s Checking`, rewards: 0, balance: p.checking },
      savings: { type: 'Savings', nickname: `${p.first}'s Savings`, rewards: 0, balance: p.savings },
      card: { type: 'Credit Card', nickname: `${p.first}'s Card`, rewards: 0, balance: p.card.balance },
    },
    records,
    flows,
    openingCashCents: dollars(p.checking + p.savings), // checking + savings only; card, retirement never count
    variableMonthlySpendCents: dollars(Object.values(p.spend).reduce((a, b) => a + b, 0)),
    monthlySpendByCategory: { housing: billCat('housing'), utilities: billCat('utilities'), transport: billCat('transport') + dollars(p.spend.transport), groceries: dollars(p.spend.groceries) },
    supplemental: { ...p.supplemental, creditLimitCents: dollars(p.card.limit) },
  };
}

export function simulate(plan) {
  const f = forecast({ asOf: ASOF, openingCashCents: plan.openingCashCents, flows: plan.flows, variableMonthlySpendCents: plan.variableMonthlySpendCents });
  return {
    forecast: f,
    emergencyCoverageMonths: emergencyCoverage({ availableCashCents: plan.openingCashCents, monthlySpendByCategory: plan.monthlySpendByCategory, flows: plan.flows }),
    debtBurden: debtPaymentBurden({ flows: plan.flows }),
    safety: cashFlowSafety(f),
  };
}
