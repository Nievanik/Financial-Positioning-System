import { Activity, ChevronRight, Gauge, LifeBuoy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cardLinkClass, linkedCardClass } from './cardLink'
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

/**
 * One server-computed health indicator from GET /health-metrics. With `to`, the whole card links there
 * (stretched link); the "How this is calculated" disclosure sits above the link and stays its own control.
 */
export function IndicatorCard({ indicator, to, linkLabel }) {
  const meta = STATUS_META[indicator.status] || STATUS_META.unknown
  const Icon = ICONS[indicator.id] || Activity
  return (
    <Card className={cn('flex flex-col gap-3 p-5', to && linkedCardClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          {to ? (
            <Link to={to} data-card-link aria-label={linkLabel ? `${indicator.label}: ${linkLabel}` : undefined} className={cn('font-medium', cardLinkClass)}>
              {indicator.label}
            </Link>
          ) : (
            <p className="font-medium">{indicator.label}</p>
          )}
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
        <details className="group relative z-10 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium text-foreground/80 hover:text-foreground">How this is calculated</summary>
          {indicator.detail && <p className="mt-1.5">{indicator.detail}</p>}
          {indicator.target && <p className="mt-1">{indicator.target}</p>}
        </details>
      )}
      {to && linkLabel && (
        <p className="mt-auto inline-flex items-center gap-0.5 text-xs font-medium text-primary" aria-hidden>
          {linkLabel} <ChevronRight className="size-3.5" />
        </p>
      )}
    </Card>
  )
}
