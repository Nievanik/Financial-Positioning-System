import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { profilePath } from '@/lib/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { FREQUENCY_LABELS, label, OBLIGATION_KIND_LABELS } from '@/lib/labels'
import { formatCents } from '@/lib/money'
import { SourceBadge } from './SourceBadge'
import { EmptyState } from './StateViews'

/**
 * Scheduled recurring cash flows (bills, loan/card payments, contributions, income) from GET /overview.
 * With `slug`, loan-payment rows link to the Loans page.
 */
export function ObligationsList({ obligations = [], income = [], limit = 8, slug }) {
  const items = [...income, ...obligations]
    .filter((o) => o.active !== false)
    .sort((a, b) => String(a.nextDate).localeCompare(String(b.nextDate)))
    .slice(0, limit)
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden /> {income.length ? 'Upcoming cash flows' : 'Upcoming bills & payments'}
        </CardTitle>
        <CardDescription>
          {income.length ? 'Take-home pay, bills and debt payments the forecast schedules.' : 'Scheduled bills and debt payments the forecast includes.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <EmptyState title="No scheduled obligations" />
        ) : (
          <ul className="divide-y">
            {items.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-12 shrink-0 rounded-md border bg-muted/50 py-1 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">{formatDay(o.nextDate, 'monthYear').split(' ')[0]}</p>
                    <p className="text-sm font-semibold leading-none">{Number(String(o.nextDate).slice(8, 10))}</p>
                  </div>
                  <div className="min-w-0">
                    {slug && o.kind === 'loan_payment' ? (
                      <Link to={profilePath(slug, 'loans')} className="block truncate text-sm font-medium text-primary hover:underline">
                        {o.name} <span className="sr-only">(view loans)</span>
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{o.name}</p>
                    )}
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {label(OBLIGATION_KIND_LABELS, o.kind)} · {label(FREQUENCY_LABELS, o.frequency)} <SourceBadge source={o.source} />
                    </p>
                  </div>
                </div>
                <Badge variant={o.signedAmountCents >= 0 ? 'success' : 'default'} className="shrink-0 text-xs tabular-nums">
                  {formatCents(o.signedAmountCents, { signed: true })}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
