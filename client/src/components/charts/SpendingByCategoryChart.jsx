import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORY_COLORS, CATEGORY_LABELS, label } from '@/lib/labels'
import { formatAxisCents, formatCents } from '@/lib/money'
import { axisStyle } from './chartUtils'

function SpendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label(CATEGORY_LABELS, d.category)}</p>
      <p className="tabular-nums">{formatCents(d.totalCents)} total</p>
      {typeof d.monthlyAverageCents === 'number' && (
        <p className="tabular-nums text-muted-foreground">{formatCents(d.monthlyAverageCents)} / month avg</p>
      )}
    </div>
  )
}

export default function SpendingByCategoryChart({ data = [] }) {
  const height = Math.max(160, data.length * 34 + 20)
  return (
    <div role="img" aria-label="Bar chart of spending by category">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatAxisCents} tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="category"
            tickFormatter={(c) => label(CATEGORY_LABELS, c)}
            tick={{ ...axisStyle, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip content={<SpendTooltip />} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="totalCents" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.category} fill={CATEGORY_COLORS[d.category] || 'var(--chart-8)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
