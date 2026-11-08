/** Display-only chart helpers (no financial calculations). */

/** X-axis ticks: the as-of day plus each month-end checkpoint. */
export function checkpointTicks(daily, checkpoints) {
  const ticks = [daily?.[0]?.date, ...(checkpoints || []).map((c) => c.date)].filter(Boolean)
  return [...new Set(ticks)]
}

/**
 * Gradient stop (0..1 from the top) where values cross the cash floor, so the area turns red below it.
 */
export function floorOffset(values, floorCents = 0) {
  const nums = values.filter((v) => typeof v === 'number')
  if (!nums.length) return 1
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  if (max <= floorCents) return 0
  if (min >= floorCents) return 1
  return (max - floorCents) / (max - min)
}

export const axisStyle = { fontSize: 11, fill: 'var(--muted-foreground)' }
