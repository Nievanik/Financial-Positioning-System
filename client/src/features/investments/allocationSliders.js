/**
 * Slider behaviour only (no financial math): set one asset class to `value`% and rescale the others
 * proportionally so the integer allocation always totals exactly 100. The server validates the total.
 */
export function rebalance(allocation, ids, id, value) {
  const v = Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
  const others = ids.filter((k) => k !== id)
  const remaining = 100 - v
  const otherTotal = others.reduce((s, k) => s + (allocation[k] || 0), 0)
  const raw = others.map((k) => (otherTotal > 0 ? ((allocation[k] || 0) / otherTotal) * remaining : remaining / others.length))
  const floors = raw.map(Math.floor)
  let leftover = remaining - floors.reduce((s, n) => s + n, 0)
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (leftover > 0) {
        floors[i] += 1
        leftover -= 1
      }
    })
  const next = { [id]: v }
  others.forEach((k, i) => {
    next[k] = floors[i]
  })
  return next
}

export const allocationTotal = (allocation, ids) => ids.reduce((s, k) => s + (allocation[k] || 0), 0)
