/** Display labels and colors for API enums (engineering.md §3.2). */

export const CATEGORY_LABELS = {
  income: 'Income',
  groceries: 'Groceries',
  housing: 'Housing',
  transport: 'Transport',
  utilities: 'Utilities',
  entertainment: 'Dining & entertainment',
  subscriptions: 'Subscriptions',
  health: 'Health',
  debt: 'Debt payments',
  savings: 'Savings & transfers',
  other: 'Other',
}

export const CATEGORY_COLORS = {
  housing: 'var(--chart-2)',
  groceries: 'var(--chart-5)',
  transport: 'var(--chart-3)',
  utilities: 'var(--chart-7)',
  entertainment: 'var(--chart-4)',
  subscriptions: 'var(--chart-6)',
  health: 'var(--chart-1)',
  other: 'var(--chart-8)',
  debt: 'var(--chart-6)',
  savings: 'var(--chart-1)',
  income: 'var(--chart-5)',
}

export const ACCOUNT_TYPE_LABELS = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit card',
  retirement: 'Retirement',
  cd: 'Certificate of deposit',
  investment: 'Investment',
}

export const OBLIGATION_KIND_LABELS = {
  income: 'Income',
  bill: 'Bill',
  loan_payment: 'Loan payment',
  credit_card_payment: 'Card payment',
  savings_contribution: 'Savings contribution',
  retirement_contribution: 'Retirement contribution',
}

export const CASHFLOW_KIND_LABELS = {
  income: 'Income',
  cash_expense: 'Cash expense',
  internal_transfer: 'Internal transfer',
  credit_purchase: 'Card purchase',
  credit_payment: 'Card payment',
  loan_payment: 'Loan payment',
  savings_contribution: 'Savings',
  retirement_contribution: 'Retirement',
}

export const LOAN_TYPE_LABELS = { auto: 'Auto', mortgage: 'Mortgage', student: 'Student', personal: 'Personal', other: 'Other' }

export const FREQUENCY_LABELS = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }

/** Indicator / risk status -> badge variant + label. */
export const STATUS_META = {
  good: { variant: 'success', label: 'Healthy' },
  low: { variant: 'success', label: 'Low risk' },
  caution: { variant: 'warning', label: 'Caution' },
  risk: { variant: 'destructive', label: 'At risk' },
  high: { variant: 'destructive', label: 'High risk' },
  unknown: { variant: 'outline', label: 'Not enough data' },
}

export const label = (map, key) => map[key] || (key ? String(key).replace(/_/g, ' ') : '—')
