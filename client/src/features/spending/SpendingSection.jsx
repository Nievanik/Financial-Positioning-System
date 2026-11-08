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
              {rows.length ? <SpendingByCategoryChart data={rows} /> : <EmptyState title="No categorized spending in this period" />}
            </CardContent>
          </Card>
        )
      }}
    </AsyncSection>
  )
}
