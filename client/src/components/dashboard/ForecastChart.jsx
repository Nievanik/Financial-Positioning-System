import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, money, moneyCompact, shortDate } from '@/lib/format'
import { floorInView, niceTicks } from '@/lib/chart'

// Recharts lives only here; ForecastPanel lazy-loads this file so the chart library is a separate chunk.
const TEAL = '#168f83'
const RED = '#cc5f5f'

function ChartTooltip({ active, payload, floor, scenarioName }) {
  if (!active || !payload?.length) return null
  const { date, cashCents, scenarioCents } = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-card">
      <div className="text-muted-foreground">{formatDate(date)}</div>
      <b className={cashCents < floor ? 'text-red' : 'text-ink'}>{money(cashCents)}</b>
      {scenarioCents !== undefined && (
        <div>
          With {scenarioName}: <b className={scenarioCents < floor ? 'text-red' : 'text-navy'}>{money(scenarioCents)}</b>
        </div>
      )}
    </div>
  )
}

export default function ForecastChart({ points, months, floor, scenarioName }) {
  const id = useId().replace(/:/g, '')
  const values = points.map((p) => p.cashCents)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const all = points.flatMap((p) => (p.scenarioCents === undefined ? [p.cashCents] : [p.cashCents, p.scenarioCents]))
  const yTicks = niceTicks(floorInView(Math.min(...all), Math.max(...all), floor) ? Math.min(...all, floor) : Math.min(...all), Math.max(...all))
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
        <Tooltip content={<ChartTooltip floor={floor} scenarioName={scenarioName} />} cursor={{ stroke: '#d5dce5' }} />
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
        {scenarioName && (
          <Area type="monotone" dataKey="scenarioCents" stroke="#142b49" strokeWidth={2} strokeDasharray="6 5" fill="none" isAnimationActive={false} activeDot={{ r: 3 }} />
        )}
        <ReferenceDot x={points[0].date} y={points[0].cashCents} r={4} fill={points[0].cashCents < floor ? RED : TEAL} stroke="#fff" strokeWidth={2} />
        <ReferenceDot x={last.date} y={last.cashCents} r={4} fill={last.cashCents < floor ? RED : TEAL} stroke="#fff" strokeWidth={2} />
        {firstShort && <ReferenceDot x={firstShort.date} y={firstShort.cashCents} r={5} fill={RED} stroke="#fff" strokeWidth={2} />}
      </AreaChart>
    </ResponsiveContainer>
  )
}
