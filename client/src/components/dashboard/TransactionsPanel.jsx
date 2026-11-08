import { useState } from 'react'
import {
  ArrowLeftRight, Banknote, Car, Clapperboard, CreditCard, HeartPulse, House, PiggyBank, Receipt, Repeat, ShoppingCart, Zap,
} from 'lucide-react'
import { ErrorNote, Panel, Skeleton } from '@/components/layout/Panel'
import { useApi } from '@/hooks/useApi'
import { money, shortDate, titleCase } from '@/lib/format'
import { CATEGORIES, txName, txSign } from '@/lib/finance'
import { cn } from '@/lib/utils'

const ICON = {
  income: Banknote, groceries: ShoppingCart, housing: House, transport: Car, utilities: Zap, entertainment: Clapperboard,
  subscriptions: Repeat, health: HeartPulse, debt: CreditCard, savings: PiggyBank, other: Receipt,
}
const PREVIEW = 6

export function TransactionsPanel({ slug, overview }) {
  const [expanded, setExpanded] = useState(false)
  const [category, setCategory] = useState('')
  // One request serves both views: the preview shows the first rows of the latest 50.
  const txs = useApi(slug && `/profiles/${slug}/transactions?limit=50${category ? `&category=${category}` : ''}`)
  const accounts = Object.fromEntries((overview.data?.accounts ?? []).map((a) => [a.id, a.name]))
  const rows = txs.data?.items.slice(0, expanded ? undefined : PREVIEW) ?? []

  return (
    <Panel
      id="transactions"
      title="Recent transactions"
      sub={expanded ? 'Latest 50 across accounts' : 'Latest activity across accounts'}
      action={
        <button onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="text-[10px] font-bold whitespace-nowrap text-[#52708e] hover:underline">
          {expanded ? 'Show less' : 'View all →'}
        </button>
      }
    >
      {expanded && (
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mb-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-[12px] text-[#405067]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
        </select>
      )}
      {txs.error ? (
        <ErrorNote error={txs.error} onRetry={txs.retry} />
      ) : txs.loading ? (
        <Skeleton className="h-52" />
      ) : !rows.length ? (
        <p className="text-[11px] text-muted-foreground">No transactions{category && ` in ${titleCase(category)}`}.</p>
      ) : (
        <div className={cn(expanded && 'max-h-[420px] overflow-y-auto')}>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="text-left text-[9px] font-[650] tracking-[0.55px] text-[#99a3b1] uppercase">
                <th className="px-[7px] pb-[9px] font-[650]">Merchant</th>
                <th className="hidden px-[7px] pb-[9px] font-[650] lg:table-cell">Account</th>
                <th className="px-[7px] pb-[9px] text-right font-[650]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const Icon = t.cashflowKind === 'internal_transfer' ? ArrowLeftRight : ICON[t.category] ?? Receipt
                const sign = txSign(t)
                return (
                  <tr key={t.id} className="border-t border-[#f0f2f5]">
                    <td className="w-full max-w-0 px-[7px] py-2.5">
                      <span className="flex items-center gap-[9px]">
                        <i className="grid size-7 flex-none place-items-center rounded-lg bg-[#f0f3f7] text-strong">
                          <Icon aria-hidden className="size-3.5" />
                        </i>
                        <span className="min-w-0">
                          <span className="block truncate font-[650] text-strong">{txName(t)}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{shortDate(t.occurredAt.slice(0, 10))} · {titleCase(t.category)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="hidden max-w-[110px] truncate px-[7px] py-2.5 text-muted-foreground lg:table-cell">{accounts[t.accountId] ?? '—'}</td>
                    <td className={cn('px-[7px] py-2.5 text-right font-bold whitespace-nowrap', sign === '+' ? 'text-teal' : sign ? 'text-ink' : 'text-muted-foreground')}>
                      {sign}{money(t.amountCents, { exact: true })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
