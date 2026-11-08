/**
 * Calendar-date helpers. The API sends calendar days as "YYYY-MM-DD" strings. `new Date("2026-11-30")`
 * is UTC midnight, which renders as Nov 29 in America/Chicago, so every calendar day is handled and
 * formatted in UTC here. Timestamps (lastSyncedAt) are formatted in the profile's time zone.
 */

const DAY_MS = 86_400_000

export function parseDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(day)) return null
  const [y, m, d] = day.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toDay(date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(day, n) {
  const d = parseDay(day)
  return d ? toDay(new Date(d.getTime() + n * DAY_MS)) : null
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a, b) {
  const da = parseDay(a)
  const db = parseDay(b)
  if (!da || !db) return null
  return Math.round((db.getTime() - da.getTime()) / DAY_MS)
}

/** Same day-of-month `n` months later, clipped to the month's last day. */
export function addMonths(day, n) {
  const d = parseDay(day)
  if (!d) return null
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + n
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return toDay(new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay))))
}

const formatters = {
  short: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  medium: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }),
  monthYear: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
  long: new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }),
}

/** @param {'short'|'medium'|'monthYear'|'long'} style */
export function formatDay(day, style = 'medium') {
  const d = parseDay(day)
  return d ? formatters[style].format(d) : '—'
}

export function formatTimestamp(iso, timeZone = 'America/Chicago') {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(d)
}
