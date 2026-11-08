/** Calendar-day helpers for "YYYY-MM-DD" strings, computed in UTC so results never shift by time zone. */
const DAY_MS = 86_400_000

export function parseDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new TypeError(`Invalid day: ${day}`)
  const [y, m, d] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const toDay = (ms) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (day, n) => toDay(parseDay(day) + n * DAY_MS)
export const daysBetween = (from, to) => Math.round((parseDay(to) - parseDay(from)) / DAY_MS)
