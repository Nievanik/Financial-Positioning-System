// Pure helpers only (no React/aliases), so Node's built-in runner is enough: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { floorInView, niceTicks } from './chart.js'
import { addDays, money, moneyCompact, titleCase } from './format.js'

test('niceTicks covers the range with 2-7 round ticks, including a flat line', () => {
  for (const [lo, hi] of [[-187192, 274984], [1683369, 2298329], [-24098, 291662], [5000, 5000], [0, 120]]) {
    const t = niceTicks(lo, hi)
    assert.ok(t[0] <= lo && t.at(-1) >= hi && t.length >= 2 && t.length <= 7, `${lo}..${hi}: ${t}`)
  }
  assert.deepEqual(niceTicks(-187192, 274984), [-200000, 0, 200000, 400000])
})

test('floor is only kept in view when the balance comes near it', () => {
  assert.equal(floorInView(1683369, 2298329, 0), false)
  assert.equal(floorInView(-187192, 274984, 0), true)
})

test('format: cents to dollars, date math across month/year', () => {
  assert.equal(money(105000), '$1,050')
  assert.equal(money(-1095000), '-$10,950')
  assert.equal(money(6842, { exact: true }), '$68.42')
  assert.equal(moneyCompact(3240000), '$32.4k')
  assert.equal(addDays('2026-12-25', 10), '2027-01-04')
  assert.equal(titleCase('credit_card'), 'Credit card')
})

test('health thresholds (engineering.md section 4 rule 6), including boundaries and nulls', async () => {
  const { coverage, burden, safety } = await import('./health.js')
  assert.deepEqual([0.35, 0.99, 1, 2.99, 3, 7.4].map((m) => coverage(m).tone), ['bad', 'bad', 'watch', 'watch', 'good', 'good'])
  assert.deepEqual([0.12, 0.199, 0.2, 0.36, 0.361].map((r) => burden(r).tone), ['good', 'good', 'watch', 'watch', 'bad'])
  assert.equal(coverage(null).tone, 'none')
  assert.equal(burden(null).tone, 'none')
  const opts = { floorCents: 0, forecastDays: 174 }
  assert.equal(safety({ minCashCents: 1683369, daysBelowFloor: 0 }, opts).tone, 'good')
  assert.equal(safety({ minCashCents: -24098, daysBelowFloor: 7 }, opts).tone, 'bad')
  assert.ok(safety({ minCashCents: -24098, daysBelowFloor: 7 }, opts).meter <= 1 / 3)
  assert.ok(safety({ minCashCents: -24098, daysBelowFloor: 7 }, opts).meter > safety({ minCashCents: -9, daysBelowFloor: 100 }, opts).meter)
  assert.equal(safety({ minCashCents: -1, daysBelowFloor: 174 }, opts).meter, 0.05)
})
