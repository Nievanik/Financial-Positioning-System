import { lazy, Suspense, useState } from 'react'
import { ErrorNote, Panel, Skeleton } from '@/components/layout/Panel'
import { formatDate, money, prettyDates, shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { floorInView } from '@/lib/chart'

const ForecastChart = lazy(() => import('./ForecastChart'))

const RANGES = [1, 2, 3, 6] // the API's checkpoint months

function Segmented({ value, onChange }) {
  return (
    <div role="group" aria-label="Forecast period" className="flex gap-px rounded-lg border border-line p-[3px]">
      {RANGES.map((m) => (
        <button
          key={m}
          aria-pressed={value === m}
          onClick={() => onChange(m)}
          className={cn('rounded-md px-1.5 py-[5px] text-[11px] text-[#79869a] sm:px-2', value === m && 'bg-[#eef2f7] font-bold text-navy')}
        >
          {m}M
        </button>
      ))}
    </div>
  )
}

const Dot = ({ className }) => <i className={cn('size-2 rounded-full', className)} />

function Insight({ forecast, explanation }) {
  const first = forecast.shortfalls[0]
  const low = Math.min(...forecast.daily.map((d) => d.cashCents))
  const fallback = first ? `Lowest projected balance ${money(low)}.` : `Lowest projected balance ${money(low)}, above your ${money(forecast.assumptions.cashFloorCents)} threshold.`
  return (
    <div className={cn('mt-2.5 flex gap-[9px] rounded-[10px] px-[13px] py-3 text-[11px]', first ? 'bg-amber-pale text-[#8a5a18]' : 'bg-teal-pale text-[#27675e]')}>
      <span aria-hidden>✦</span>
      <div className="min-w-0 flex-1">
        <strong className={cn('mb-0.5 block text-[12px]', first ? 'text-[#7a4f12]' : 'text-[#205c54]')}>
          {first ? `Cash runs short on ${shortDate(first.date)}` : 'Looking steady'}
        </strong>
        {explanation.loading ? <Skeleton className="h-3 w-4/5" /> : (explanation.data?.text ? prettyDates(explanation.data.text) : fallback)}
      </div>
    </div>
  )
}

// scenario = { name, daily } from a what-if evaluation, drawn as a dashed line over the baseline.
export function ForecastPanel({ forecast, explanation, scenario }) {
  const [months, setMonths] = useState(6)
  const f = forecast.data
  const end = f?.checkpoints.find((c) => c.month === months)
  const scenarioOn = scenario && new Map(scenario.daily.map((d) => [d.date, d.cashCents]))
  const points = f ? f.daily.filter((d) => d.date <= end.date).map((d) => (scenarioOn ? { ...d, scenarioCents: scenarioOn.get(d.date) } : d)) : []
  const floor = f?.assumptions.cashFloorCents ?? 0
  const anyShort = points.some((p) => p.cashCents < floor)
  const floorShown = !f || floorInView(Math.min(...points.map((p) => p.cashCents)), Math.max(...points.map((p) => p.cashCents)), floor)

  return (
    <Panel
      id="forecast"
      title="Cash flow forecast"
      sub={`Estimated spendable cash over the next ${months === 1 ? 'month' : `${months} months`}`}
      action={<Segmented value={months} onChange={setMonths} />}
    >
      {forecast.error ? (
        <ErrorNote error={forecast.error} onRetry={forecast.retry} />
      ) : forecast.loading ? (
        <Skeleton className="h-[220px] md:h-[245px]" />
      ) : (
        <>
          <div
            className="h-[220px] md:h-[245px]"
            role="img"
            aria-label={`Projected cash goes from ${money(points[0].cashCents)} today to ${money(end.cashCents)} on ${formatDate(end.date)}${anyShort ? `, dropping below ${money(floor)} in this period` : ''}.`}
          >
            <Suspense fallback={<Skeleton className="h-full" />}>
              <ForecastChart points={points} months={months} floor={floor} scenarioName={scenario?.name} />
            </Suspense>
          </div>
          <table className="sr-only">
            <caption>Forecast checkpoints</caption>
            <thead><tr><th>Month</th><th>Date</th><th>Projected cash</th></tr></thead>
            <tbody>
              {f.checkpoints.map((c) => <tr key={c.month}><td>{c.month}</td><td>{formatDate(c.date)}</td><td>{money(c.cashCents)}</td></tr>)}
            </tbody>
          </table>
          <div className="mt-2 flex flex-wrap gap-x-[17px] gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Dot className="bg-teal" />Projected balance</span>
            <span className="flex items-center gap-1.5">
              <Dot className="bg-[#b6c4d4]" />Low-balance threshold ({money(floor)}{floorShown ? '' : ', below chart'})
            </span>
            {anyShort && <span className="flex items-center gap-1.5"><Dot className="bg-red" />Below threshold</span>}
            {scenario && <span className="flex items-center gap-1.5"><i className="w-3.5 border-t-2 border-dashed border-navy" />With {scenario.name}</span>}
          </div>
          <Insight forecast={f} explanation={explanation} />
        </>
      )}
    </Panel>
  )
}
