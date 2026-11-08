import { Info } from 'lucide-react'
import ForecastChart from '@/components/charts/ForecastChart'
import { ExplanationPanel } from '@/components/financial/ExplanationPanel'
import { AsyncSection, EmptyState, LoadingCard } from '@/components/financial/StateViews'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { CheckpointList } from './CheckpointList'

export function ForecastAssumptions({ assumptions }) {
  if (!assumptions) return null
  return (
    <p className="flex gap-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        Deterministic daily cash-flow projection (no randomness, no AI-generated numbers) of checking + savings, using the last{' '}
        {assumptions.historyMonths} months of history. Scheduled income, bills, loan and card payments are placed on their due dates; estimated
        variable spending is spread evenly across each week regardless of payment method, and existing card payments cover carried balances only.
      </span>
    </p>
  )
}

export function ForecastSection({ slug, query }) {
  return (
    <AsyncSection query={query} loading={<LoadingCard chart />}>
      {(f) => {
        const floor = f.assumptions?.cashFloorCents ?? 0
        return (
          <Card>
            <CardHeader>
              <CardTitle>Six-month cash-flow forecast</CardTitle>
              <CardDescription>
                Projected available cash each day from {formatDay(f.asOf)} through {formatDay(f.checkpoints?.at(-1)?.date)}.
                Red marks days below your cash floor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!f.daily?.length ? (
                <EmptyState title="No forecast available">The engine returned no projection for this profile.</EmptyState>
              ) : (
                <>
                  <ForecastChart daily={f.daily} checkpoints={f.checkpoints} floorCents={floor} />
                  <CheckpointList checkpoints={f.checkpoints} floorCents={floor} />
                  <ForecastAssumptions assumptions={f.assumptions} />
                  <ExplanationPanel slug={slug} payload={{ subject: 'forecast' }} label="Explain my forecast" />
                </>
              )}
            </CardContent>
          </Card>
        )
      }}
    </AsyncSection>
  )
}
