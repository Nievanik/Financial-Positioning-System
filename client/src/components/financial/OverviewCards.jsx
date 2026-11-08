import { CreditCard, Landmark, PiggyBank, Wallet } from 'lucide-react'
import { formatCents, isCents } from '@/lib/money'
import { StatCard } from './StatCard'

/**
 * Top-line balances from GET /overview (`cash` + `totals`, adapted in lib/apiAdapters.js). Each figure is
 * shown separately so spendable cash is never conflated with long-term holdings or unused credit.
 * All values are server-computed. `links` (optional) makes each card a link: { cash, card, loans, longTerm }.
 */
export function OverviewCards({ cash = {}, links = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Available cash"
        icon={Wallet}
        tone="primary"
        to={links.cash}
        linkLabel="View accounts"
        value={formatCents(cash.availableCashCents)}
        sub={`Checking ${formatCents(cash.checkingCents, { whole: true })} · Savings ${formatCents(cash.savingsCents, { whole: true })}`}
      />
      <StatCard
        label="Credit card balances"
        icon={CreditCard}
        to={links.card}
        linkLabel="View card"
        value={formatCents(cash.creditCardDebtCents)}
        sub={
          isCents(cash.creditLimitCents)
            ? `Limit ${formatCents(cash.creditLimitCents, { whole: true })} · ${formatCents(cash.unusedCreditCents, { whole: true })} unused — unused credit is not cash`
            : 'Unused credit is not counted as cash'
        }
      />
      <StatCard
        label="Loans outstanding"
        icon={Landmark}
        to={links.loans}
        linkLabel="View loans"
        value={formatCents(cash.loanDebtCents)}
        sub="Payments are scheduled in the forecast once"
      />
      <StatCard
        label="Retirement, investments & CDs"
        icon={PiggyBank}
        tone="muted"
        to={links.longTerm}
        linkLabel="Open Investment Planner"
        value={formatCents(cash.longTermCents)}
        sub="Long-term holdings — not spendable cash. Details in the Investment Planner."
      />
    </div>
  )
}
