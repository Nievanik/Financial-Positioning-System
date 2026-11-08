import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDay } from '@/lib/dates'
import { formatAxisCents } from '@/lib/money'
import { CashTooltip } from './ChartTooltip'
import { axisStyle, checkpointTicks } from './chartUtils'

/** Baseline vs. what-if daily cash, both returned by POST /scenarios/evaluate. */
export default function ScenarioComparisonChart({ baseline, scenario, floorCents = 0, height = 300, scenarioName = 'With decision' }) {
  const data = useMemo(() => {
    const alt = new Map((scenario?.daily || []).map((d) => [d.date, d.cashCents]))
    return (baseline?.daily || []).map((d) => ({ date: d.date, baseline: d.cashCents, scenario: alt.get(d.date) ?? null }))
  }, [baseline, scenario])
  const checkpoints = baseline?.checkpoints || []

  return (
    <div role="img" aria-label="Line chart comparing baseline and scenario daily cash">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            ticks={checkpointTicks(baseline?.daily, checkpoints)}
            tickFormatter={(d) => formatDay(d, 'short')}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={8}
          />
          <YAxis tickFormatter={formatAxisCents} tick={axisStyle} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<CashTooltip floorCents={floorCents} />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} />
          <Legend verticalAlign="top" align="right" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={floorCents} stroke="var(--destructive)" strokeDasharray="4 4" />
          {checkpoints.map((c) => (
            <ReferenceLine key={c.month} x={c.date} stroke="var(--border)" />
          ))}
          <Line type="stepAfter" dataKey="baseline" name="Baseline" stroke="var(--muted-foreground)" strokeWidth={1.75} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          <Line type="stepAfter" dataKey="scenario" name={scenarioName} stroke="var(--chart-2)" strokeWidth={2.25} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
