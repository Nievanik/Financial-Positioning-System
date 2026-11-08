import { Activity, Gauge, LifeBuoy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { STATUS_META } from '@/lib/labels'
import { formatCents, formatRatio } from '@/lib/money'

const ICONS = { emergency_coverage: LifeBuoy, debt_payment_burden: Gauge, cash_flow_safety: Activity }

function formatValue(ind) {
  if (ind.value === null || ind.value === undefined) return 'N/A'
  if (ind.unit === 'months') return `${Number(ind.value).toFixed(1)} mo`
  if (ind.unit === 'ratio') return formatRatio(ind.value)
  if (ind.unit === 'cents') return formatCents(ind.value, { whole: true })
  return String(ind.value)
}

/** One server-computed health indicator from GET /health-metrics. */
export function IndicatorCard({ indicator }) {
  const meta = STATUS_META[indicator.status] || STATUS_META.unknown
  const Icon = ICONS[indicator.id] || Activity
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <p className="font-medium">{indicator.label}</p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatValue(indicator)}</p>
        {indicator.id === 'cash_flow_safety' && (
          <p className="text-xs text-muted-foreground">
            lowest daily balance{indicator.minimumDate ? ` · ${formatDay(indicator.minimumDate)}` : ''}
            {typeof indicator.daysBelowFloor === 'number' && ` · ${indicator.daysBelowFloor} day(s) below floor`}
          </p>
        )}
        {indicator.isEstimate && <p className="text-xs text-muted-foreground">Estimate</p>}
      </div>
      {indicator.summary && <p className="text-sm text-muted-foreground">{indicator.summary}</p>}
      {(indicator.detail || indicator.target) && (
        <details className="group text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium text-foreground/80 hover:text-foreground">How this is calculated</summary>
          {indicator.detail && <p className="mt-1.5">{indicator.detail}</p>}
          {indicator.target && <p className="mt-1">{indicator.target}</p>}
        </details>
      )}
    </Card>
  )
}
