import { formatDay } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

/** Month-end checkpoints 1/2/3/6 — labeled with their actual dates, not "30/60/90/180 days". */
export function CheckpointList({ checkpoints = [], floorCents = 0 }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {checkpoints.map((c) => (
        <div key={c.month} className="rounded-lg border bg-muted/30 p-3">
          <dt className="text-xs text-muted-foreground">
            Month {c.month} · <span className="font-medium text-foreground/80">{formatDay(c.date)}</span>
          </dt>
          <dd className={cn('mt-1 text-lg font-semibold tabular-nums', c.cashCents < floorCents && 'text-destructive')}>
            {formatCents(c.cashCents, { whole: true })}
          </dd>
        </div>
      ))}
    </dl>
  )
}
