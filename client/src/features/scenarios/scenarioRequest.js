/**
 * Form-state <-> request-body mapping for POST /scenarios/evaluate (engineering.md §5.2).
 * Only input parsing/validation lives here; all forecasting happens on the server.
 */
import { addDays, addMonths, parseDay, toDay } from '@/lib/dates'
import { centsToInput, dollarsToCents } from '@/lib/money'

export const SCENARIO_TYPES = [
  { value: 'one_time', label: 'One-time purchase' },
  { value: 'down_payment_recurring', label: 'Down payment + monthly' },
  { value: 'monthly_spending_reduction', label: 'Spending reduction' },
]

export const REDUCTION_CATEGORIES = ['entertainment', 'groceries', 'transport', 'subscriptions', 'health', 'other']

export function firstOfNextMonth(asOf) {
  const d = parseDay(asOf)
  if (!d) return ''
  return toDay(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)))
}

export function presets(asOf) {
  const start = firstOfNextMonth(asOf)
  return [
    { id: 'laptop', label: '$2,000 laptop', form: { type: 'one_time', name: 'Laptop', amount: '2000', startDate: start } },
    {
      id: 'house',
      label: 'House: $10k down + $3k/mo',
      form: { type: 'down_payment_recurring', name: 'New house', downPayment: '10000', monthlyAmount: '3000', startDate: addMonths(start, 1), durationMonths: '6' },
    },
    {
      id: 'car',
      label: 'Car: $2k down + $450/mo',
      form: { type: 'down_payment_recurring', name: 'Newer car', downPayment: '2000', monthlyAmount: '450', startDate: start, durationMonths: '6' },
    },
    {
      id: 'dining',
      label: 'Cut dining $100/mo',
      form: { type: 'monthly_spending_reduction', name: 'Cut dining out', monthlyAmount: '100', category: 'entertainment', startDate: start, durationMonths: '6' },
    },
  ]
}

export function emptyForm(asOf) {
  return { ...presets(asOf)[0].form }
}

/** Load a recommendation's `action` (a scenario request) into form state. */
export function formFromScenario(s) {
  return {
    type: s.type,
    name: s.name || '',
    amount: centsToInput(s.amountCents),
    downPayment: centsToInput(s.downPaymentCents),
    monthlyAmount: centsToInput(s.monthlyAmountCents),
    category: s.category || 'entertainment',
    startDate: s.startDate || '',
    durationMonths: s.durationMonths ? String(s.durationMonths) : '6',
  }
}

/** Returns `{ body, errors }`. `bounds` = { minDate, maxDate } from the baseline forecast. */
export function buildScenario(form, bounds) {
  const errors = {}
  const name = (form.name || '').trim() || SCENARIO_TYPES.find((t) => t.value === form.type)?.label
  const body = { type: form.type, name }

  if (!form.startDate) errors.startDate = 'Choose a start date.'
  else if (bounds.minDate && form.startDate < bounds.minDate) errors.startDate = 'Must be after the snapshot date.'
  else if (bounds.maxDate && form.startDate > bounds.maxDate) errors.startDate = 'Must be inside the six-month forecast.'
  body.startDate = form.startDate

  const money = (key, field, { allowZero = false } = {}) => {
    const cents = dollarsToCents(form[key])
    if (cents === null) errors[key] = 'Enter a dollar amount, e.g. 2000 or 2000.50.'
    else if (!allowZero && cents <= 0) errors[key] = 'Must be more than $0.'
    else body[field] = cents
  }

  if (form.type === 'one_time') money('amount', 'amountCents')
  if (form.type === 'down_payment_recurring') {
    money('downPayment', 'downPaymentCents')
    money('monthlyAmount', 'monthlyAmountCents')
  }
  if (form.type === 'monthly_spending_reduction') {
    money('monthlyAmount', 'monthlyAmountCents')
    body.category = form.category || 'entertainment'
  }
  if (form.type !== 'one_time') {
    const n = Number(form.durationMonths)
    if (!Number.isInteger(n) || n < 1 || n > 6) errors.durationMonths = 'Between 1 and 6 months.'
    else body.durationMonths = n
  }
  return { body, errors }
}

export function dateBounds(forecast) {
  if (!forecast) return { minDate: '', maxDate: '' }
  return { minDate: addDays(forecast.asOf, 1), maxDate: forecast.checkpoints?.at(-1)?.date || '' }
}
