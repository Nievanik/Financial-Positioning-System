import SpendingByCategoryChart from '@/components/charts/SpendingByCategoryChart'
import { AsyncSection, EmptyState, LoadingCard } from '@/components/financial/StateViews'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { formatCents } from '@/lib/money'

/** Accepts byCategory as an array or a `{ category: cents }` map (contract shape still being finalized). */
function normalize(byCategory) {
  if (Array.isArray(byCategory)) return byCategory
  if (byCategory && typeof byCategory === 'object') {
    return Object.entries(byCategory).map(([category, v]) => (typeof v === 'number' ? { category, totalCents: v } : { category, ...v }))
  }
  return []
}

export function SpendingSection({ query }) {
  return (
    <AsyncSection query={query} loading={<LoadingCard chart className="h-full" />}>
      {(s) => {
        const rows = normalize(s.byCategory).filter((r) => r.totalCents > 0).sort((a, b) => b.totalCents - a.totalCents)
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Where the money goes</CardTitle>
              <CardDescription>
                Merchant spending by category
                {s.period ? `, ${formatDay(s.period.from)} – ${formatDay(s.period.to)}` : ''}. Transfers and debt repayments are excluded so nothing is
                counted twice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total ({s.period?.months ?? 3} mo)</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCents(s.totalCents, { whole: true })}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Fixed / month</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCents(s.fixedMonthlyCents, { whole: true })}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Variable / month (est.)</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCents(s.variableMonthlyCents, { whole: true })}</p>
                </div>
              </div>
              {typeof s.incomeMonthlyCents === 'number' && (
                // Server-computed monthly view (GET /spending): take-home income vs fixed + variable expenses.
                <dl className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-sm" aria-label="Monthly income versus expenses">
                  <div>
                    <dt className="text-xs text-muted-foreground">Take-home / month</dt>
                    <dd className="font-semibold tabular-nums">{formatCents(s.incomeMonthlyCents, { whole: true })}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Expenses / month</dt>
                    <dd className="font-semibold tabular-nums">{formatCents(s.expensesMonthlyCents, { whole: true })}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Net / month</dt>
                    <dd className={s.netCashFlowMonthlyCents < 0 ? 'font-semibold tabular-nums text-destructive' : 'font-semibold tabular-nums text-success'}>
                      {formatCents(s.netCashFlowMonthlyCents, { whole: true, signed: true })}
                    </dd>
                  </div>
                </dl>
              )}
              {rows.length ? <SpendingByCategoryChart data={rows} /> : <EmptyState title="No categorized spending in this period" />}
            </CardContent>
          </Card>
        )
      }}
    </AsyncSection>
  )
}
