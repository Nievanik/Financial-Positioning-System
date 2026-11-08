import { ArrowRight, Lightbulb, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/money'
import { EmptyState } from './StateViews'

const SIMULATABLE = ['one_time', 'down_payment_recurring', 'monthly_spending_reduction']

/** The structured POST /scenarios/evaluate body for "Try it" (server `scenario`; legacy object `action`). */
const tryableScenario = (r) => {
  const s = r.scenario ?? (r.action && typeof r.action === 'object' ? r.action : null)
  return s && SIMULATABLE.includes(s.type) ? s : null
}

function Impact({ label, cents }) {
  if (typeof cents !== 'number' || cents === 0) return null
  return (
    <Badge variant={cents > 0 ? 'success' : 'destructive'} className="tabular-nums">
      <TrendingUp /> {formatCents(cents, { whole: true, signed: true })} {label}
    </Badge>
  )
}

/**
 * Calculation-backed next-best actions. Impacts come from the engine (server), never the UI or an LLM.
 * `onTry(action)` lets the user load a recommendation into the simulator.
 */
export function RecommendationList({ recommendations = [], onTry, emptyText = 'No calculation-backed changes improve this forecast right now.' }) {
  if (!recommendations.length) return <EmptyState icon={Lightbulb} title="No recommendations">{emptyText}</EmptyState>
  return (
    <ul className="grid gap-3">
      {recommendations.map((r) => (
        <li key={r.id} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="flex items-center gap-2 font-medium">
              <Lightbulb className="size-4 shrink-0 text-[var(--chart-3)]" aria-hidden /> {r.title}
            </p>
            {onTry && tryableScenario(r) && (
              <Button size="sm" variant="outline" onClick={() => onTry(tryableScenario(r))} aria-label={`Try “${r.title}” in the simulator`}>
                Try it <ArrowRight />
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Impact label="by month 6" cents={r.impactMonth6Cents} />
            <Impact label="to lowest balance" cents={r.impactMinimumCashCents} />
          </div>
          {typeof r.action === 'string' && <p className="mt-2 text-sm font-medium">{r.action}</p>}
          {r.explanation && <p className="mt-1 text-sm text-muted-foreground">{r.explanation}</p>}
          {r.assumptions?.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">Assumes: {r.assumptions.join(' · ')}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
