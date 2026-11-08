import ScenarioComparisonChart from '@/components/charts/ScenarioComparisonChart'
import { ExplanationPanel } from '@/components/financial/ExplanationPanel'
import { RecommendationList } from '@/components/financial/RecommendationList'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDay } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

const RISK = {
  ok: { variant: 'success', title: 'No shortfall: cash stays above your floor every day' },
  shortfall: { variant: 'destructive', title: 'Cash shortfall: this falls below your floor' },
  low: { variant: 'success', title: 'Low risk: cash stays above your floor' },
  caution: { variant: 'warning', title: 'Caution: your cushion gets thin' },
  high: { variant: 'destructive', title: 'High risk: this creates a cash shortfall' },
}

function Delta({ cents }) {
  if (typeof cents !== 'number') return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('font-medium tabular-nums', cents < 0 ? 'text-destructive' : cents > 0 ? 'text-success' : 'text-muted-foreground')}>
      {formatCents(cents, { whole: true, signed: true })}
    </span>
  )
}

export function AssessmentBanner({ assessment }) {
  if (!assessment) return null
  const meta = RISK[assessment.riskLevel] || RISK.caution
  return (
    <Alert
      variant={meta.variant}
      title={
        assessment.firstShortfallDate
          ? `${meta.title} — first on ${formatDay(assessment.firstShortfallDate, 'long')}`
          : meta.title
      }
    >
      {assessment.reasons?.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {assessment.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
    </Alert>
  )
}

export function CheckpointComparison({ result, floorCents = 0 }) {
  const base = result.baseline?.checkpoints || []
  const alt = new Map((result.scenario?.checkpoints || []).map((c) => [c.month, c]))
  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>Month-end</TH>
          <TH className="text-right">Baseline</TH>
          <TH className="text-right">With decision</TH>
          <TH className="text-right">Change</TH>
        </TR>
      </THead>
      <TBody>
        {base.map((c) => {
          const s = alt.get(c.month)
          return (
            <TR key={c.month}>
              <TD>
                <span className="font-medium">Month {c.month}</span>
                <span className="block text-xs text-muted-foreground">{formatDay(c.date)}</span>
              </TD>
              <TD className={cn('text-right tabular-nums', c.cashCents < floorCents && 'text-destructive')}>{formatCents(c.cashCents, { whole: true })}</TD>
              <TD className={cn('text-right font-medium tabular-nums', s?.cashCents < floorCents && 'text-destructive')}>
                {formatCents(s?.cashCents, { whole: true })}
              </TD>
              <TD className="text-right"><Delta cents={result.deltas?.[`month${c.month}Cents`]} /></TD>
            </TR>
          )
        })}
        <TR>
          <TD>
            <span className="font-medium">Days below floor</span>
            <span className="block text-xs text-muted-foreground">Any day, not just month-end</span>
          </TD>
          <TD className="text-right tabular-nums">{result.baseline?.shortfalls?.length ?? 0}</TD>
          <TD className={cn('text-right font-medium tabular-nums', result.scenario?.shortfalls?.length && 'text-destructive')}>
            {result.scenario?.shortfalls?.length ?? 0}
          </TD>
          <TD className="text-right">
            {typeof result.deltas?.minimumCashCents === 'number' && (
              <span className="text-xs text-muted-foreground">
                lowest balance <Delta cents={result.deltas.minimumCashCents} />
              </span>
            )}
          </TD>
        </TR>
      </TBody>
    </Table>
  )
}

export function ScenarioResults({ slug, scenario, result, floorCents, onTry }) {
  return (
    <div className="space-y-4">
      <AssessmentBanner assessment={result.assessment} />
      <Card>
        <CardHeader>
          <CardTitle>Baseline vs. “{scenario.name}”</CardTitle>
          <CardDescription>Daily available cash (checking + savings). The dashed red line is your cash floor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScenarioComparisonChart baseline={result.baseline} scenario={result.scenario} floorCents={floorCents} scenarioName={scenario.name} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Month-end comparison</CardTitle>
          <CardDescription>Checkpoint dates are actual month-ends, so month 1 may be only weeks away.</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckpointComparison result={result} floorCents={floorCents} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ways to make it work</CardTitle>
          <CardDescription>Alternatives evaluated by the same engine, with their computed impact versus this scenario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecommendationList
            recommendations={result.recommendations}
            onTry={onTry}
            emptyText="No calculated alternative improves this scenario — it may already be the safer option."
          />
          <ExplanationPanel slug={slug} payload={{ subject: 'scenario', scenario }} label="Explain this result" />
        </CardContent>
      </Card>
    </div>
  )
}
