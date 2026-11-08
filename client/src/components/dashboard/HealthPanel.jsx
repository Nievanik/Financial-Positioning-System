import { ErrorNote, Meter, Panel, Pill, Skeleton } from '@/components/layout/Panel'
import { combine } from '@/hooks/useApi'
import { money } from '@/lib/format'
import { burden, coverage, safety, SUMMARY, TONE_LABEL } from '@/lib/health'

function Metric({ name, result }) {
  return (
    <div className="border-b border-[#eff1f4] py-3 last:border-b-0 last:pb-0.5">
      <div className="flex justify-between gap-2.5 text-[12px] font-[650]">
        <span>{name}</span>
        <Pill tone={result.tone}>{TONE_LABEL[result.tone]}</Pill>
      </div>
      <p className="mt-1 mb-2 text-[10.5px] text-muted-foreground">{result.text}</p>
      <Meter value={result.meter} tone={result.tone === 'good' ? 'good' : result.tone === 'watch' ? 'warn' : 'bad'} label={name} />
    </div>
  )
}

// Needs the forecast too: cash-flow safety is measured over its daily horizon.
export function HealthPanel({ health, forecast }) {
  const state = combine(health, forecast)
  const h = health.data
  const metrics = h && [
    ['Emergency savings', coverage(h.indicators.emergencyCoverage.months)],
    ['Debt payment burden', burden(h.indicators.debtPaymentBurden.ratio)],
    ['Cash-flow safety', safety(h.indicators.cashFlowSafety, { floorCents: h.assumptions.cashFloorCents, forecastDays: forecast.data?.daily.length ?? 0 })],
  ]
  const good = metrics?.filter(([, r]) => r.tone === 'good').length ?? 0

  return (
    <Panel id="health" title="Financial health" sub="A few signals to keep you on track">
      {state.error ? (
        <ErrorNote error={state.error} onRetry={state.retry} />
      ) : state.loading ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <div className="mb-3.5 flex items-center gap-[17px] rounded-[11px] border border-line bg-soft p-[13px]">
            <div
              role="img"
              aria-label={`${good} of 3 indicators on track`}
              className="relative grid size-[59px] flex-none place-items-center rounded-full before:absolute before:inset-[5px] before:rounded-full before:bg-soft"
              style={{ background: `conic-gradient(var(--color-teal) 0 ${(good / 3) * 100}%, #e3ecea ${(good / 3) * 100}%)` }}
            >
              <b className="z-[1] text-[16px]">{good}/3</b>
            </div>
            <div className="text-[13px] font-bold">
              {SUMMARY[good]}
              <small className="block text-[11px] font-normal text-muted-foreground">{good} of 3 indicators on track</small>
            </div>
          </div>

          {metrics.map(([name, result]) => <Metric key={name} name={name} result={result} />)}

          <details className="mt-3 text-[10.5px] text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-strong">How we calculate this</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li><b>Emergency savings</b>: spendable cash ÷ monthly essentials (housing, utilities, groceries, transport, health, plus debt payments), averaged over the last {h.assumptions.historyMonths} months. On track at 3+ months, at risk under 1.</li>
              <li><b>Debt payment burden</b>: scheduled loan and card payments ÷ monthly gross income. On track under 20%, at risk over 36%.</li>
              <li><b>Cash-flow safety</b>: lowest projected daily balance and days below the {money(h.assumptions.cashFloorCents)} floor in the 6-month forecast. Any day below is at risk.</li>
              <li>{h.assumptions.note}</li>
            </ul>
          </details>
        </>
      )}
    </Panel>
  )
}
