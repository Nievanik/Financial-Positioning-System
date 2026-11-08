export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const firstName = (name = '') => name.split(/\s+/)[0]

// Date-only 'YYYY-MM-DD' (API asOf/nextDate) is read as UTC so it doesn't shift a day; timestamps use local time.
export const formatDate = (value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(value).toLocaleDateString('en-US', { ...opts, timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : undefined })

export const greeting = (hour = new Date().getHours()) =>
  hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// API money is integer cents; whole dollars by default, `exact` keeps cents (transactions).
export const money = (cents, { exact = false } = {}) => (exact ? usdCents : usd).format(cents / 100)

export const shortDate = (value) => formatDate(value, { month: 'short', day: 'numeric' })

// 'YYYY-MM-DD' + n days, as 'YYYY-MM-DD' (string-comparable with API dates).
export const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })

// Chart axis labels: 3240000 cents -> "$32.4k", -187192 -> "-$1.9k".
export const moneyCompact = (cents) => usdCompact.format(cents / 100).replace('K', 'k').replace('M', 'm')

// Backend text (explanations, recommendation actions) embeds ISO dates; show them like the rest of the UI.
export const prettyDates = (text = '') => text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (d) => formatDate(d))
