import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDay } from '@/lib/dates'
import { formatAxisCents } from '@/lib/money'
import { CashTooltip } from './ChartTooltip'
import { axisStyle, checkpointTicks, floorOffset } from './chartUtils'

/**
 * Daily projected available cash (checking + savings) with month-end checkpoints and the cash floor.
 * The area turns red on any day below the floor, even when the month-end balance recovers.
 */
export default function ForecastChart({ daily = [], checkpoints = [], floorCents = 0, height = 280 }) {
  const gid = useId().replace(/:/g, '')
  const offset = floorOffset(daily.map((d) => d.cashCents), floorCents)
  return (
    <div role="img" aria-label="Line chart of projected daily available cash over the next six months">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={daily} margin={{ top: 16, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset={offset} stopColor="var(--chart-1)" stopOpacity={0.06} />
              <stop offset={offset} stopColor="var(--destructive)" stopOpacity={0.12} />
              <stop offset={1} stopColor="var(--destructive)" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={offset} stopColor="var(--chart-1)" />
              <stop offset={offset} stopColor="var(--destructive)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            ticks={checkpointTicks(daily, checkpoints)}
            tickFormatter={(d) => formatDay(d, 'short')}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={8}
          />
          <YAxis tickFormatter={formatAxisCents} tick={axisStyle} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<CashTooltip floorCents={floorCents} />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} />
          <ReferenceLine
            y={floorCents}
            stroke="var(--destructive)"
            strokeDasharray="4 4"
            label={{ value: floorCents ? 'Cash floor' : '$0 floor', position: 'insideBottomLeft', fontSize: 10, fill: 'var(--destructive)' }}
          />
          {checkpoints.map((c) => (
            <ReferenceLine key={`l-${c.month}`} x={c.date} stroke="var(--border)" />
          ))}
          <Area
            type="stepAfter"
            dataKey="cashCents"
            name="Projected cash"
            stroke={`url(#stroke-${gid})`}
            strokeWidth={2}
            fill={`url(#fill-${gid})`}
            isAnimationActive={false}
            activeDot={{ r: 4 }}
          />
          {checkpoints.map((c) => (
            <ReferenceDot
              key={`d-${c.month}`}
              x={c.date}
              y={c.cashCents}
              r={5}
              fill={c.cashCents < floorCents ? 'var(--destructive)' : 'var(--chart-1)'}
              stroke="var(--card)"
              strokeWidth={2}
              label={{ value: `M${c.month}`, position: 'top', fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
