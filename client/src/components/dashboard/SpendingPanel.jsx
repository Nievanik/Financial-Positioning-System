import { ErrorNote, Panel, Skeleton } from '@/components/layout/Panel'
import { combine } from '@/hooks/useApi'
import { money, titleCase } from '@/lib/format'
import { topCategories } from '@/lib/finance'
import { cn } from '@/lib/utils'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
const colorOf = (c, i) => (c.category === 'other' ? 'var(--chart-5)' : COLORS[i])

// month = GET /spending?months=1 (the breakdown), quarter = months=3 (average + monthly income/expenses).
export function SpendingPanel({ month, quarter }) {
  const state = combine(month, quarter)
  const m = month.data
  const q = quarter.data

  let body
  if (state.error) body = <ErrorNote error={state.error} onRetry={state.retry} />
  else if (state.loading) body = <Skeleton className="h-52" />
  else if (!m.totalCents) body = <p className="text-[11px] text-muted-foreground">No spending in the last 30 days.</p>
  else {
    const slices = topCategories(m.byCategory)
    const stops = slices.reduce((acc, c, i) => {
      const from = acc.end
      const end = from + (c.totalCents / m.totalCents) * 100
      return { end, list: [...acc.list, `${colorOf(c, i)} ${from}% ${end}%`] }
    }, { end: 0, list: [] }).list
    const diff = m.totalCents - Math.round(q.totalCents / 3)
    body = (
      <>
        <div className="my-0.5 text-[22px] font-[730]">{money(m.totalCents)}</div>
        <div className="text-[11px] text-muted-foreground">
          {money(Math.abs(diff))} {diff <= 0 ? 'less' : 'more'} than your 3-month average
        </div>
        <div className="flex items-center gap-2.5 pt-[5px] pb-3 sm:gap-4">
          <div
            role="img"
            aria-label={`Spending by category: ${slices.map((c) => `${titleCase(c.category)} ${money(c.totalCents)}`).join(', ')}`}
            className="relative size-[100px] flex-none rounded-full after:absolute after:inset-[19px] after:rounded-full after:bg-white sm:size-[116px]"
            style={{ background: `conic-gradient(${stops.join(', ')})` }}
          >
            <div className="absolute inset-0 z-[1] grid place-content-center text-center text-[13px] font-bold">
              {money(m.totalCents)}
              <small className="text-[9px] font-normal text-muted-foreground">total spent</small>
            </div>
          </div>
          <ul className="grid flex-1 gap-2 text-[10px]">
            {slices.map((c, i) => (
              <li key={c.category} className="flex justify-between gap-2 text-[#667387]">
                <span className="flex items-center gap-1.5">
                  <i className="size-[7px] rounded-full" style={{ background: colorOf(c, i) }} />
                  {titleCase(c.category)}
                </span>
                <b className="text-strong">{money(c.totalCents)}</b>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-t border-[#f0f2f5] pt-3 text-[10px] text-muted-foreground">
          <div><dt>Income / mo</dt><dd className="text-[12px] font-bold text-strong">{money(q.incomeMonthlyCents)}</dd></div>
          <div><dt>Expenses / mo</dt><dd className="text-[12px] font-bold text-strong">{money(q.expensesMonthlyCents)}</dd></div>
          <div>
            <dt>Net / mo</dt>
            <dd className={cn('text-[12px] font-bold', q.netCashFlowMonthlyCents < 0 ? 'text-red' : 'text-teal')}>
              {q.netCashFlowMonthlyCents > 0 && '+'}{money(q.netCashFlowMonthlyCents)}
            </dd>
          </div>
        </dl>
      </>
    )
  }

  return (
    <Panel id="spending" title="Spending breakdown" sub="Last 30 days · by category">
      {body}
    </Panel>
  )
}
