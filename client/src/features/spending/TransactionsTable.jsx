import { useState } from 'react'
import { ErrorState, EmptyState } from '@/components/financial/StateViews'
import { SourceBadge } from '@/components/financial/SourceBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useTransactions } from '@/features/profiles/useProfileData'
import { formatDay } from '@/lib/dates'
import { CASHFLOW_KIND_LABELS, CATEGORY_LABELS, label } from '@/lib/labels'
import { formatCents } from '@/lib/money'

const CATEGORIES = ['', 'income', 'groceries', 'housing', 'transport', 'utilities', 'entertainment', 'subscriptions', 'health', 'debt', 'savings', 'other']

/**
 * Transaction history from GET /transactions. With `accountId`, the server returns only that account's
 * transactions (engineering.md 5.1), so the row limit applies to the account's own history.
 */
export function TransactionsTable({ slug, accounts = [], accountId, title = 'Recent transactions', emptyTitle, emptyText }) {
  const accountName = Object.fromEntries(accounts.map((a) => [String(a.id), a.name]))
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState(25)
  const query = useTransactions(slug, accountId ? { category, limit, accountId } : { category, limit })
  const items = query.data?.items || []
  const showAccount = !accountId

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Newest first. “Cash impact” is the effect on checking + savings — card purchases and internal transfers move $0 of cash.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="tx-category">Category</label>
          <Select id="tx-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c ? label(CATEGORY_LABELS, c) : 'All categories'}</option>
            ))}
          </Select>
          <label className="sr-only" htmlFor="tx-limit">Rows</label>
          <Select id="tx-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-28">
            {[25, 50, 100].map((n) => <option key={n} value={n}>{n} rows</option>)}
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {query.error ? (
          <ErrorState error={query.error} onRetry={query.reload} />
        ) : query.loading && !query.data ? (
          <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : !items.length ? (
          category || !emptyTitle ? (
            <EmptyState title="No transactions match this filter" />
          ) : (
            <EmptyState title={emptyTitle}>{emptyText}</EmptyState>
          )
        ) : (
          <div className={query.loading ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Date</TH>
                  <TH>Description</TH>
                  {showAccount && <TH className="hidden md:table-cell">Account</TH>}
                  <TH className="hidden sm:table-cell">Type</TH>
                  <TH className="hidden lg:table-cell">Category</TH>
                  <TH className="text-right">Amount</TH>
                  <TH className="text-right">Cash impact</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((t) => (
                  <TR key={t.id}>
                    <TD className="whitespace-nowrap text-muted-foreground">{formatDay(String(t.occurredAt).slice(0, 10), 'short')}</TD>
                    <TD>
                      <span className="flex flex-wrap items-center gap-1.5 font-medium">
                        {t.merchantName || t.description} <SourceBadge source={t.source} />
                      </span>
                    </TD>
                    {showAccount && <TD className="hidden text-muted-foreground md:table-cell">{t.accountName || accountName[String(t.accountId)] || '—'}</TD>}
                    <TD className="hidden sm:table-cell">
                      <Badge variant="outline">{label(CASHFLOW_KIND_LABELS, t.cashflowKind)}</Badge>
                    </TD>
                    <TD className="hidden text-muted-foreground lg:table-cell">{label(CATEGORY_LABELS, t.category)}</TD>
                    <TD className="text-right tabular-nums">{formatCents(t.amountCents)}</TD>
                    <TD
                      className={
                        t.cashImpactCents > 0 ? 'text-right tabular-nums text-success' : t.cashImpactCents < 0 ? 'text-right tabular-nums' : 'text-right tabular-nums text-muted-foreground'
                      }
                    >
                      {formatCents(t.cashImpactCents, { signed: true })}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
