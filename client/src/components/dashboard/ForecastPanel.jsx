import { useId, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorNote, Panel, Skeleton } from '@/components/layout/Panel'
import { formatDate, money, moneyCompact, shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { floorInView, niceTicks } from '@/lib/chart'

const TEAL = '#168f83'
const RED = '#cc5f5f'
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

function ChartTooltip({ active, payload, floor }) {
  if (!active || !payload?.length) return null
  const { date, cashCents } = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-card">
      <div className="text-muted-foreground">{formatDate(date)}</div>
      <b className={cashCents < floor ? 'text-red' : 'text-ink'}>{money(cashCents)}</b>
    </div>
  )
}

function Chart({ points, months, floor }) {
  const id = useId().replace(/:/g, '')
  const values = points.map((p) => p.cashCents)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const yTicks = niceTicks(floorInView(min, max, floor) ? Math.min(min, floor) : min, max)
  const lo = yTicks[0]
  const hi = yTicks.at(-1)
  // Split colour only when the line actually crosses the floor (a stop at exactly 0/1 bleeds a pixel).
  // Stop = fraction from the top of each shape's bounding box: stroke spans max..min, fill spans max..lo.
  const crosses = min < floor && max > floor
  const split = (bottom) => (max - floor) / (max - bottom)
  const solid = min < floor ? RED : TEAL
  const ticks = months === 1 ? points.filter((_, i) => i % 7 === 0).map((p) => p.date) : points.filter((p) => p.date.endsWith('-01')).map((p) => p.date)
  const firstShort = points.find((p) => p.cashCents < floor)
  const last = points.at(-1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={split(min)} stopColor={TEAL} />
            <stop offset={split(min)} stopColor={RED} />
          </linearGradient>
          <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor={crosses ? TEAL : solid} stopOpacity={0.2} />
            {crosses && <stop offset={split(lo)} stopColor={TEAL} stopOpacity={0.02} />}
            {crosses && <stop offset={split(lo)} stopColor={RED} stopOpacity={0.1} />}
            <stop offset={1} stopColor={crosses ? RED : solid} stopOpacity={crosses ? 0.22 : 0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#edf0f3" />
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={(d) => (months === 1 ? shortDate(d) : formatDate(d, { month: 'short' }))}
          tick={{ fill: '#9aa5b3', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[lo, hi]}
          ticks={yTicks}
          tickFormatter={moneyCompact}
          tick={{ fill: '#9aa5b3', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<ChartTooltip floor={floor} />} cursor={{ stroke: '#d5dce5' }} />
        <ReferenceLine y={floor} stroke="#a8bacb" strokeWidth={2} strokeDasharray="5 6" />
        <Area
          type="monotone"
          dataKey="cashCents"
          baseValue={lo}
          stroke={crosses ? `url(#${id}s)` : solid}
          strokeWidth={3}
          strokeLinecap="round"
          fill={`url(#${id}f)`}
          isAnimationActive={false}
          activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
        />
        <ReferenceDot x={points[0].date} y={points[0].cashCents} r={4} fill={points[0].cashCents < floor ? RED : TEAL} stroke="#fff" strokeWidth={2} />
        <ReferenceDot x={last.date} y={last.cashCents} r={4} fill={last.cashCents < floor ? RED : TEAL} stroke="#fff" strokeWidth={2} />
        {firstShort && <ReferenceDot x={firstShort.date} y={firstShort.cashCents} r={5} fill={RED} stroke="#fff" strokeWidth={2} />}
      </AreaChart>
    </ResponsiveContainer>
  )
}

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
        {explanation.loading ? <Skeleton className="h-3 w-4/5" /> : explanation.data?.text ?? fallback}
      </div>
    </div>
  )
}

export function ForecastPanel({ forecast, explanation }) {
  const [months, setMonths] = useState(6)
  const f = forecast.data
  const end = f?.checkpoints.find((c) => c.month === months)
  const points = f ? f.daily.filter((d) => d.date <= end.date) : []
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
            <Chart points={points} months={months} floor={floor} />
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
          </div>
          <Insight forecast={f} explanation={explanation} />
        </>
      )}
    </Panel>
  )
}
