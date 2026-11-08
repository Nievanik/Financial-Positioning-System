/**
 * Money display helpers. All amounts from the API are integer cents; the only arithmetic here
 * is the cents -> dollars conversion needed for display and dollars -> cents for form input.
 */

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function isCents(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * @param {number|null|undefined} cents
 * @param {{ whole?: boolean, compact?: boolean, signed?: boolean }} [opts]
 */
export function formatCents(cents, opts = {}) {
  if (!isCents(cents)) return '—'
  const dollars = cents / 100
  const fmt = opts.compact ? usdCompact : opts.whole ? usdWhole : usd
  const text = fmt.format(Math.abs(dollars))
  if (dollars < 0) return `−${text}`
  if (opts.signed && dollars > 0) return `+${text}`
  return text
}

/** Short axis label, e.g. $12.5K. */
export function formatAxisCents(cents) {
  return formatCents(cents, { compact: true })
}

/**
 * Parse a user-typed dollar string ("2,000" / "2000.5" / "$10k" not supported) into integer cents
 * without binary floating-point arithmetic. Returns null when the input is not a valid amount.
 */
export function dollarsToCents(input) {
  if (input === null || input === undefined) return null
  const cleaned = String(input).replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [whole, frac = ''] = cleaned.split('.')
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

/** Integer cents -> plain dollar string for pre-filling inputs ("2000" / "2000.50"). */
export function centsToInput(cents) {
  if (!isCents(cents)) return ''
  const whole = Math.trunc(cents / 100)
  const frac = Math.abs(cents % 100)
  return frac ? `${whole}.${String(frac).padStart(2, '0')}` : String(whole)
}

/** Ratio (0.234) -> "23.4%". */
export function formatRatio(ratio, digits = 1) {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return '—'
  return `${(ratio * 100).toFixed(digits)}%`
}

/** Basis points (425) -> "4.25%". */
export function formatBps(bps) {
  if (typeof bps !== 'number' || !Number.isFinite(bps)) return '—'
  return `${(bps / 100).toFixed(2)}%`
}
