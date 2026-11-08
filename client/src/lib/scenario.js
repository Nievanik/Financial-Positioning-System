// What-if form (dollars, as the sliders show them) -> POST /scenarios/evaluate body (integer cents).
// Shapes and limits: server/src/engine/scenarios.js validate().
import { addDays } from './format.js'

export const TYPES = {
  one_time: { label: 'One-time purchase', name: 'One-time purchase' },
  down_payment_recurring: { label: 'Financed purchase', name: 'Financed purchase' },
  monthly_spending_reduction: { label: 'Cut monthly spending', name: 'Spending cut' },
}

export function toRequest({ type, amount, downPayment, monthly, duration, startDate }) {
  const base = { type, name: TYPES[type].name, startDate }
  const cents = (dollars) => Math.round(dollars * 100)
  if (type === 'one_time') return { ...base, amountCents: cents(amount) }
  if (type === 'down_payment_recurring') return { ...base, downPaymentCents: cents(downPayment), monthlyAmountCents: cents(monthly), durationMonths: duration }
  return { ...base, monthlyAmountCents: cents(monthly), durationMonths: duration }
}

// Start options: the 1st of each of the next `count` months (always after asOf, inside the 6-month forecast).
export function startMonths(asOf, count = 5) {
  const [y, m] = asOf.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m + i, 1)).toISOString().slice(0, 10)).filter((d) => d > asOf && d <= addDays(asOf, 186))
}
