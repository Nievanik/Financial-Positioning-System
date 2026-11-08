import { CalendarClock, CircleDollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { ErrorNote, Skeleton } from '@/components/layout/Panel'
import { combine } from '@/hooks/useApi'
import { money, shortDate } from '@/lib/format'
import { dueWithin } from '@/lib/finance'

function SpendTrend({ now, avg }) {
  if (!avg) return 'Last 30 days'
  const pct = ((now - avg) / avg) * 100
  return (
    <>
      <span className={pct <= 0 ? 'font-semibold text-teal' : 'font-semibold text-red'}>
        {pct <= 0 ? '↓' : '↑'} {Math.abs(pct).toFixed(1)}%
      </span>{' '}
      vs. 3-month average
    </>
  )
}

function StatCard({ label, icon: Icon, state, value, foot }) {
  return (
    <article className="rounded-[13px] border border-line bg-paper p-[13px] shadow-card sm:px-[19px] sm:py-[18px]">
      <div className="flex items-center justify-between text-[10px] font-semibold text-label sm:text-[12px]">
        {label}
        <span className="grid size-[31px] place-items-center rounded-[9px] bg-tile text-navy">
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      {state.error ? (
        <div className="mt-2.5"><ErrorNote error={state.error} onRetry={state.retry} /></div>
      ) : state.loading ? (
        <>
          <Skeleton className="mt-2.5 mb-1 h-[30px] w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </>
      ) : (
        <>
          <div className="mt-2.5 mb-1 text-[20px] font-[730] tracking-[-0.65px] sm:text-[25px]">{value()}</div>
          <div className="text-[9px] text-muted-foreground sm:text-[11px]">{foot()}</div>
        </>
      )}
    </article>
  )
}

// overview + spending for the last month (actual) and last 3 months (average and the recurring income figure).
export function StatCards({ overview, month, quarter }) {
  const o = overview.data
  const m = month.data
  const q = quarter.data
  const due = () => dueWithin(o, 14)

  return (
    <section aria-label="Financial summary" className="mb-[17px] grid grid-cols-2 gap-[9px] sm:gap-[15px] lg:grid-cols-4">
      <StatCard
        label="Available cash"
        icon={CircleDollarSign}
        state={overview}
        value={() => money(o.cash.availableCents)}
        foot={() => <>Checking <b>{money(o.cash.checkingCents)}</b> · Savings <b>{money(o.cash.savingsCents)}</b></>}
      />
      <StatCard
        label="Monthly income"
        icon={TrendingUp}
        state={combine(overview, quarter)}
        value={() => money(q.incomeMonthlyCents)}
        foot={() => (o.income[0] ? <>Next payday <b>{shortDate(o.income[0].nextDate)}</b> · take-home</> : 'No income on file')}
      />
      <StatCard
        label="Monthly spending"
        icon={TrendingDown}
        state={combine(month, quarter)}
        value={() => money(m.totalCents)}
        foot={() => <SpendTrend now={m.totalCents} avg={q.totalCents / 3} />}
      />
      <StatCard
        label="Bills coming up"
        icon={CalendarClock}
        state={overview}
        value={() => money(due().reduce((s, b) => s + b.amountCents, 0))}
        foot={() => `Next 14 days · ${due().length} payment${due().length === 1 ? '' : 's'}`}
      />
    </section>
  )
}
