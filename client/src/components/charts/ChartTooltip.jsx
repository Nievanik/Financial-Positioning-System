import { formatDay } from '@/lib/dates'
import { formatCents } from '@/lib/money'

/** Shared tooltip: payload values are integer cents, label is a YYYY-MM-DD day. */
export function CashTooltip({ active, payload, label, floorCents }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{formatDay(label, 'long')}</p>
      {payload
        .filter((p) => p.value !== null && p.value !== undefined)
        .map((p) => (
          <p key={p.dataKey} className="flex items-center justify-between gap-4 tabular-nums">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block size-2 rounded-full" style={{ background: p.color || p.stroke }} />
              {p.name}
            </span>
            <span className={typeof floorCents === 'number' && p.value < floorCents ? 'font-semibold text-destructive' : 'font-semibold'}>
              {formatCents(p.value)}
            </span>
          </p>
        ))}
    </div>
  )
}
