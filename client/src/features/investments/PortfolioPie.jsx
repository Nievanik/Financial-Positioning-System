import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCents, formatRatio } from '@/lib/money'
import { cn } from '@/lib/utils'
import { GROUP_COLORS } from './assumptions'

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{d.label}</p>
      <p className="tabular-nums">{formatCents(d.totalCents)}</p>
      <p className="text-muted-foreground">Click to see accounts</p>
    </div>
  )
}

/** Long-term holdings by group from GET /investments/portfolio; liquid cash is excluded by the server. */
export function PortfolioPie({ portfolio, selected, onSelect }) {
  const data = (portfolio?.groups || []).filter((g) => g.totalCents > 0)
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="totalCents"
              nameKey="label"
              innerRadius="58%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
              onClick={(d) => onSelect(d?.payload?.id ?? d?.id)}
              className="cursor-pointer"
            >
              {data.map((g) => (
                <Cell
                  key={g.id}
                  fill={GROUP_COLORS[g.id] || 'var(--chart-8)'}
                  fillOpacity={!selected || selected === g.id ? 1 : 0.3}
                  stroke={selected === g.id ? 'var(--foreground)' : 'var(--card)'}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">Long-term total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCents(portfolio?.totalLongTermCents, { whole: true })}</span>
        </div>
      </div>
      <ul className="space-y-2" aria-label="Portfolio groups">
        {data.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onSelect(g.id)}
              aria-pressed={selected === g.id}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted',
                selected === g.id && 'border-foreground/40 bg-muted',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="size-3 rounded-sm" style={{ background: GROUP_COLORS[g.id] }} aria-hidden />
                {g.label}
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold tabular-nums">{formatCents(g.totalCents, { whole: true })}</span>
                <span className="block text-xs text-muted-foreground">{formatRatio(g.shareBps / 10000, 0)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
