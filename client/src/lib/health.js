// Raw indicators from GET /health-metrics -> label, tone and meter fill. Thresholds: engineering.md section 4, rule 6.
import { money } from './format.js'

export const TONE_LABEL = { good: 'On track', watch: 'Keep an eye on it', bad: 'At risk', none: 'Not enough data' }

export function coverage(months) {
  if (months == null) return { tone: 'none', meter: 0, text: 'No essential expenses on file' }
  return {
    tone: months < 1 ? 'bad' : months < 3 ? 'watch' : 'good',
    meter: months / 6, // 6 months = full bar
    text: `${months.toFixed(1)} months of essential expenses covered`,
  }
}

export function burden(ratio) {
  if (ratio == null) return { tone: 'none', meter: 0, text: 'No income on file' }
  return {
    tone: ratio > 0.36 ? 'bad' : ratio >= 0.2 ? 'watch' : 'good',
    meter: 1 - ratio / 0.5, // fuller = lighter burden; 50%+ of income = empty
    text: `${Math.round(ratio * 100)}% of monthly gross income goes to debt payments`,
  }
}

export function safety({ minCashCents, daysBelowFloor }, { floorCents, forecastDays }) {
  const bad = daysBelowFloor > 0
  return {
    tone: bad ? 'bad' : 'good',
    // At risk stays in the bottom third (shorter = more days short) so a red bar never looks nearly full.
    meter: bad ? Math.max(0.05, (1 - daysBelowFloor / forecastDays) / 3) : 1,
    text: bad
      ? `Below ${money(floorCents)} on ${daysBelowFloor} of the next ${forecastDays} days · lowest ${money(minCashCents)}`
      : `Stays above ${money(floorCents)} for 6 months · lowest ${money(minCashCents)}`,
  }
}

export const SUMMARY = ['Needs attention now', 'Needs attention', 'Mostly on track', 'Good momentum'] // by on-track count
