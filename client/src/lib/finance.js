import { addDays } from './format.js'

// shortcut: overview.obligations holds each flow's NEXT date only, so a weekly bill counts once in 14 days.
// All seeded obligations are monthly; count occurrences if weekly bills are ever added.
export const dueWithin = (overview, days) => overview.obligations.filter((o) => o.nextDate <= addDays(overview.asOf, days))

// Donut slices: top 4 named categories + "Other" (the rest, including the API's own `other` category).
export function topCategories(byCategory, n = 4) {
  const named = byCategory.filter((c) => c.category !== 'other')
  const rest = [...named.slice(n), ...byCategory.filter((c) => c.category === 'other')]
  const top = named.slice(0, n)
  const restCents = rest.reduce((s, c) => s + c.totalCents, 0)
  return restCents ? [...top, { category: 'other', totalCents: restCents }] : top
}

// Seed descriptions carry classification tags like "[grp:…]" or "[card]"; never show them.
export const txName = (t) => (t.merchantName || t.description).replace(/\s*\[[^\]]*\]/g, '').trim()

// Display sign: money in = +, moves between own accounts = none, everything else (incl. card purchases) = −.
export const txSign = (t) => (t.cashflowKind === 'income' ? '+' : t.cashflowKind === 'internal_transfer' ? '' : '−')

// Transaction.category enum (server/src/models/Transaction.js), for the filter.
export const CATEGORIES = ['income', 'groceries', 'housing', 'transport', 'utilities', 'entertainment', 'subscriptions', 'health', 'debt', 'savings', 'other']
