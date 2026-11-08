import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { ACCOUNT_TYPE_LABELS, label, LOAN_TYPE_LABELS } from '@/lib/labels'
import { formatBps, formatCents } from '@/lib/money'
import { profilePath } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { SourceBadge } from './SourceBadge'
import { EmptyState } from './StateViews'

const ACCOUNT_GROUPS = [
  { title: 'Spendable cash', types: ['checking', 'savings'] },
  { title: 'Credit cards', types: ['credit_card'] },
  { title: 'Long-term (not spendable)', types: ['retirement', 'investment', 'cd'] },
]

function Row({ name, meta, amount, source, negative, to, selected }) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-medium">
          {name} <SourceBadge source={source} />
        </p>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>
      <span className="flex shrink-0 items-center gap-1">
        <span className={negative ? 'text-sm font-semibold tabular-nums text-destructive' : 'text-sm font-semibold tabular-nums'}>
          {negative ? '−' : ''}{formatCents(amount)}
        </span>
        {to && <ChevronRight className="size-4 text-muted-foreground" aria-hidden />}
      </span>
    </>
  )
  return (
    <li>
      {to ? (
        <Link
          to={to}
          aria-current={selected ? 'page' : undefined}
          className={cn(
            '-mx-2 flex min-h-11 items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted',
            selected && 'bg-accent text-accent-foreground hover:bg-accent',
          )}
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-3 py-2">{body}</div>
      )}
    </li>
  )
}

const accountMeta = (a) =>
  [
    label(ACCOUNT_TYPE_LABELS, a.type),
    a.creditLimitCents ? `limit ${formatCents(a.creditLimitCents, { whole: true })}` : null,
    a.annualRateBps ? `${formatBps(a.annualRateBps)} APY` : null,
    a.maturityDate ? `matures ${formatDay(a.maturityDate)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

/**
 * Grouped accounts (and optionally loans) from GET /overview. With `slug`, rows link to the account's page
 * (loan rows to Loans); `selectedId` marks the open account.
 */
export function AccountsList({ accounts = [], loans = [], slug, selectedId, title = 'Accounts & debts', description = 'Card and loan balances are amounts owed.', className }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {!accounts.length && !loans.length && <EmptyState title="No accounts on file" />}
        {ACCOUNT_GROUPS.map((g) => {
          const items = accounts.filter((a) => g.types.includes(a.type))
          if (!items.length) return null
          return (
            <section key={g.title}>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.title}</h4>
              <ul className={slug ? 'mt-1 space-y-0.5' : 'divide-y'}>
                {items.map((a) => (
                  <Row
                    key={a.id}
                    name={a.name}
                    source={a.source}
                    amount={a.balanceCents}
                    negative={a.type === 'credit_card'}
                    meta={accountMeta(a)}
                    to={slug ? profilePath(slug, 'accounts', a.id) : undefined}
                    selected={selectedId !== undefined && String(selectedId) === String(a.id)}
                  />
                ))}
              </ul>
            </section>
          )
        })}
        {loans.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loans</h4>
            <ul className={slug ? 'mt-1 space-y-0.5' : 'divide-y'}>
              {loans.map((l) => (
                <Row
                  key={l.id}
                  name={l.name}
                  source={l.source}
                  amount={l.outstandingCents}
                  negative
                  to={slug ? profilePath(slug, 'loans') : undefined}
                  meta={[
                    `${label(LOAN_TYPE_LABELS, l.loanType)} loan`,
                    `${formatCents(l.monthlyPaymentCents)}/mo due day ${l.dueDay}`,
                    l.annualRateBps ? `${formatBps(l.annualRateBps)} APR` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
