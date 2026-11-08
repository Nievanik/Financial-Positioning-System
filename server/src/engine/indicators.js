// Health indicators (docs/engineering.md section 4, rule 6). Pure, integer cents; ratios are plain numbers.
const ESSENTIAL = ['housing', 'utilities', 'groceries', 'transport', 'health'];
const PER_MONTH = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1 };
const DEBT_KINDS = ['loan_payment', 'credit_card_payment'];

export const monthly = (f, cents) => Math.round(cents * PER_MONTH[f.frequency]);
const active = (flows) => flows.filter((f) => f.active !== false);

export function monthlyDebtPaymentCents(flows) {
  return active(flows)
    .filter((f) => DEBT_KINDS.includes(f.kind))
    .reduce((sum, f) => sum + monthly(f, -f.signedAmountCents), 0);
}

// Months of essential costs covered by cash; null when there are no essential costs.
export function emergencyCoverage({ availableCashCents, monthlySpendByCategory = {}, flows }) {
  const essential = ESSENTIAL.reduce((s, c) => s + (monthlySpendByCategory[c] || 0), 0) + monthlyDebtPaymentCents(flows);
  return essential > 0 ? availableCashCents / essential : null;
}

// Debt payments / monthly gross income; null when there is no income.
export function debtPaymentBurden({ flows }) {
  const income = active(flows)
    .filter((f) => f.kind === 'income')
    .reduce((s, f) => s + monthly(f, f.grossAmountCents ?? 0), 0);
  return income > 0 ? monthlyDebtPaymentCents(flows) / income : null;
}

// Lowest projected daily cash and days below the floor, from a forecast() result.
export function cashFlowSafety({ daily, shortfalls }) {
  return { minCashCents: Math.min(...daily.map((d) => d.cashCents)), daysBelowFloor: shortfalls.length };
}
