import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDay } from '@/lib/dates'
import { ACCOUNT_TYPE_LABELS, label, LOAN_TYPE_LABELS } from '@/lib/labels'
import { formatBps, formatCents } from '@/lib/money'
import { SourceBadge } from './SourceBadge'
import { EmptyState } from './StateViews'

const GROUPS = [
  { title: 'Spendable cash', types: ['checking', 'savings'] },
  { title: 'Credit cards', types: ['credit_card'] },
  { title: 'Long-term (not spendable)', types: ['retirement', 'investment', 'cd'] },
]

function Row({ name, meta, amount, source, negative }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-medium">
          {name} <SourceBadge source={source} />
        </p>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>
      <p className={negative ? 'shrink-0 text-sm font-semibold tabular-nums text-destructive' : 'shrink-0 text-sm font-semibold tabular-nums'}>
        {negative ? '−' : ''}{formatCents(amount)}
      </p>
    </li>
  )
}

export function AccountsList({ accounts = [], loans = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts &amp; debts</CardTitle>
        <CardDescription>Card and loan balances are amounts owed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!accounts.length && !loans.length && <EmptyState title="No accounts on file" />}
        {GROUPS.map((g) => {
          const items = accounts.filter((a) => g.types.includes(a.type))
          if (!items.length) return null
          return (
            <section key={g.title}>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.title}</h4>
              <ul className="divide-y">
                {items.map((a) => (
                  <Row
                    key={a.id}
                    name={a.name}
                    source={a.source}
                    amount={a.balanceCents}
                    negative={a.type === 'credit_card'}
                    meta={[
                      label(ACCOUNT_TYPE_LABELS, a.type),
                      a.creditLimitCents ? `limit ${formatCents(a.creditLimitCents, { whole: true })}` : null,
                      a.annualRateBps ? `${formatBps(a.annualRateBps)} APY` : null,
                      a.maturityDate ? `matures ${formatDay(a.maturityDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                ))}
              </ul>
            </section>
          )
        })}
        {loans.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loans</h4>
            <ul className="divide-y">
              {loans.map((l) => (
                <Row
                  key={l.id}
                  name={l.name}
                  source={l.source}
                  amount={l.outstandingCents}
                  negative
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
