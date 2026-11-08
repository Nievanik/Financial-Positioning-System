/**
 * Pure routing helpers for the banking navigation (docs/design.md section 3). No React, no `@/` aliases,
 * so lib.test.js can run them with Node's test runner.
 */

/** The five sections under /p/:slug, in sidebar order. `path` is relative to /p/:slug. */
export const SECTIONS = [
  { id: 'overview', path: '', label: 'Overview', group: 'Banking' },
  { id: 'accounts', path: 'accounts', label: 'Accounts', group: 'Banking' },
  { id: 'loans', path: 'loans', label: 'Loans', group: 'Banking' },
  { id: 'simulate', path: 'simulate', label: 'Cash-Flow Simulator', short: 'Simulator', group: 'Planning' },
  { id: 'investments', path: 'investments', label: 'Investment Planner', short: 'Investments', group: 'Planning' },
]

const enc = encodeURIComponent

/** `/p/<slug>[/<section>[/<id>]]` */
export function profilePath(slug, section = '', id) {
  let out = `/p/${enc(slug)}`
  if (section) out += `/${section}`
  if (id !== undefined && id !== null && id !== '') out += `/${enc(id)}`
  return out
}

/** Path segments after /p/:slug, e.g. '/p/a/accounts/123' -> ['accounts', '123']. */
function rest(pathname, slug) {
  const prefix = `/p/${enc(slug)}`
  const alt = `/p/${slug}`
  const tail = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.startsWith(alt) ? pathname.slice(alt.length) : ''
  return tail.split('/').filter(Boolean)
}

/** Which sidebar section is active for a pathname ('overview' for the dashboard; null if unknown). */
export function activeSection(pathname, slug) {
  const [first] = rest(pathname, slug)
  if (!first) return 'overview'
  return SECTIONS.some((s) => s.path === first) ? first : null
}

/**
 * Where the demo customer switcher goes: same section for the new customer. Account ids belong to one
 * customer, so an account detail route lands on the new customer's Accounts list. Unknown sub-routes fall
 * back to Overview. `search` (e.g. ?mock=1) is kept.
 */
export function switchProfilePath(pathname, fromSlug, toSlug, search = '') {
  const section = fromSlug ? activeSection(pathname, fromSlug) : 'overview'
  const target = !section || section === 'overview' ? '' : section
  return `${profilePath(toSlug, target)}${search || ''}`
}

/**
 * The loan-payment flow for a loan from GET /overview `obligations[]`: matched by `loanId`; older mock
 * fixtures have no `loanId`, so fall back to the loan_payment flow with the same name. Returns the
 * obligation (server values unchanged) or null.
 */
export function loanPaymentFlow(loan, obligations = []) {
  if (!loan) return null
  const payments = obligations.filter((o) => o.kind === 'loan_payment')
  const id = String(loan.id)
  return payments.find((o) => o.loanId !== undefined && o.loanId !== null && String(o.loanId) === id)
    ?? payments.find((o) => (o.loanId === undefined || o.loanId === null) && o.name === loan.name)
    ?? null
}

/** Dashboard credit-card link: the card's own page when there is exactly one card, else the Accounts list. */
export function creditCardTarget(slug, accounts = []) {
  const cards = accounts.filter((a) => a.type === 'credit_card')
  return cards.length === 1 ? profilePath(slug, 'accounts', cards[0].id) : profilePath(slug, 'accounts')
}

export const SPENDABLE_TYPES = ['checking', 'savings']
export const LONG_TERM_TYPES = ['retirement', 'investment', 'cd']

/** Default account for /accounts: first checking, then savings, then card, then anything. */
export function defaultAccount(accounts = []) {
  for (const t of ['checking', 'savings', 'credit_card']) {
    const a = accounts.find((x) => x.type === t)
    if (a) return a
  }
  return accounts[0] ?? null
}
