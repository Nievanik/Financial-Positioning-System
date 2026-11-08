import { ErrorNote, Panel, Skeleton } from '@/components/layout/Panel'
import { formatDate, money } from '@/lib/format'
import { dueWithin } from '@/lib/finance'

const KIND = { bill: 'Bill', loan_payment: 'Loan', credit_card_payment: 'Card payment', savings_contribution: 'Savings', retirement_contribution: 'Retirement' }

export function UpcomingPanel({ overview }) {
  const o = overview.data
  const soon = o ? new Set(dueWithin(o, 14)) : null
  return (
    <Panel id="upcoming" title="Upcoming payments" sub="Next due date of each bill and loan payment">
      {overview.error ? (
        <ErrorNote error={overview.error} onRetry={overview.retry} />
      ) : overview.loading ? (
        <Skeleton className="h-48" />
      ) : !o.obligations.length ? (
        <p className="text-[11px] text-muted-foreground">No scheduled payments.</p>
      ) : (
        <ul>
          {o.obligations.map((b) => (
            <li key={`${b.name}-${b.nextDate}`} className="flex items-center gap-[9px] border-t border-[#f0f2f5] py-2 first:border-t-0">
              <span className="grid w-9 flex-none rounded-lg bg-[#f0f3f7] py-0.5 text-center leading-tight">
                <small className="text-[9px] font-semibold text-muted-foreground uppercase">{formatDate(b.nextDate, { month: 'short' })}</small>
                <b className="text-[13px] text-strong">{formatDate(b.nextDate, { day: 'numeric' })}</b>
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-[650] text-strong">{b.name}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  {KIND[b.kind] ?? b.kind} · {b.frequency}
                  {soon.has(b) && <span className="ml-1.5 rounded-[20px] bg-amber-pale px-[7px] py-px text-[10px] font-bold text-[#a36a1d]">Within 14 days</span>}
                </div>
              </div>
              <b className="text-[12px] text-strong">{money(b.amountCents)}</b>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
