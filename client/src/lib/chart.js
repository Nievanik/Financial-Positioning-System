// Round axis ticks (1/2/2.5/5 × 10^n) covering [lo, hi] in about 4 steps.
export function niceTicks(lo, hi) {
  const raw = Math.max(hi - lo, 100) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw)
  const ticks = [Math.floor(lo / step) * step]
  while (ticks.at(-1) < hi || ticks.length < 2) ticks.push(ticks.at(-1) + step)
  return ticks
}

// Floor only enters the y-range when the balance comes near it; otherwise it would flatten the line.
export const floorInView = (min, max, floor) => min - floor <= max - min
