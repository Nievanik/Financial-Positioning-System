import { CalendarClock } from 'lucide-react'
import { SourceBadge } from '@/components/financial/SourceBadge'
import { EmptyState } from '@/components/financial/StateViews'
import { Badge } from '@/components/ui/badge'
import { formatDay } from '@/lib/dates'
import { ACCOUNT_TYPE_LABELS, label } from '@/lib/labels'
import { formatBps, formatCents } from '@/lib/money'
import { RISK_BADGE } from './assumptions'

/** Accounts behind the selected pie segment, as returned by GET /investments/portfolio. */
export function AccountDrilldown({ portfolio, groupId }) {
  const group = portfolio?.groups?.find((g) => g.id === groupId)
  if (!group) {
    return <EmptyState title="Select a segment">Click a slice of the chart (or a group on the right) to see the accounts inside it.</EmptyState>
  }
  const items = portfolio.accounts.filter((a) => a.group === groupId)
  if (!items.length) return <EmptyState title={`No ${group.label.toLowerCase()} accounts`} />

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Accounts in {group.label}</h3>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((a) => (
          <li key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{label(ACCOUNT_TYPE_LABELS, a.type)}</p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums">{formatCents(a.balanceCents)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {a.riskLabel && (
                <Badge variant={RISK_BADGE[a.riskLevel] || 'outline'} title={a.riskNote || undefined}>
                  {a.riskLabel}
                  {a.riskIsAssumed && ' (assumed)'}
                </Badge>
              )}
              {a.annualRateBps ? <Badge variant="outline">{formatBps(a.annualRateBps)} APY</Badge> : null}
              <SourceBadge source={a.source} />
            </div>
            {a.holdingsNote && <p className="mt-2 text-xs text-muted-foreground">{a.holdingsNote}</p>}
            {a.type === 'cd' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs">
                <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />
                {a.maturityDate ? (
                  <>
                    Matures <span className="font-medium">{formatDay(a.maturityDate)}</span>
                    {typeof a.daysToMaturity === 'number' && (
                      <span className="text-muted-foreground">({a.daysToMaturity >= 0 ? `in ${a.daysToMaturity} days` : 'matured'})</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">Maturity date not provided</span>
                )}
              </p>
            )}
            {a.riskNote && <p className="mt-1 text-xs text-muted-foreground">{a.riskNote}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
