import { ArrowRight, CreditCard, PiggyBank, SearchX, Wallet } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AccountsList } from '@/components/financial/AccountsList'
import { SourceBadge } from '@/components/financial/SourceBadge'
import { EmptyState } from '@/components/financial/StateViews'
import { StatCard } from '@/components/financial/StatCard'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentProfile } from '@/features/profiles/useCurrentProfile'
import { TransactionsTable } from '@/features/spending/TransactionsTable'
import { formatDay } from '@/lib/dates'
import { ACCOUNT_TYPE_LABELS, label } from '@/lib/labels'
import { formatBps, formatCents, isCents } from '@/lib/money'
import { defaultAccount, LONG_TERM_TYPES, profilePath, SPENDABLE_TYPES } from '@/lib/navigation'
import { PageHeader } from './Dashboard'

/** Plain-language rule for how an account counts (engineering.md invariants: cash = checking + savings only). */
function countsAs(type) {
  if (SPENDABLE_TYPES.includes(type)) return 'Counts toward available cash (checking + savings).'
  if (type === 'credit_card') return 'The balance is money owed. The credit limit and unused credit are never counted as cash.'
  if (LONG_TERM_TYPES.includes(type)) return 'Long-term holding — not spendable cash. Counted in net worth and in the Investment Planner.'
  return null
}

function emptyCopy(type) {
  if (type === 'savings')
    return { title: 'No transactions on this savings account', text: 'In this demo data, transfers into savings are recorded on the checking account (as “Savings & transfers”), so savings has no rows of its own.' }
  if (LONG_TERM_TYPES.includes(type))
    return { title: 'No transactions for long-term holdings', text: 'Retirement, brokerage and CD balances are synthetic supplements without a transaction history in this demo.' }
  return { title: 'No transactions on this account', text: 'Nothing has been recorded on this account in the snapshot window.' }
}

function Detail({ term, children }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="text-sm font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function AccountDetails({ account, slug }) {
  const isCard = account.type === 'credit_card'
  const isLongTerm = LONG_TERM_TYPES.includes(account.type)
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label(ACCOUNT_TYPE_LABELS, account.type)}</CardDescription>
        <CardTitle as="h2" className="flex flex-wrap items-center gap-2 text-lg">
          {account.name} <SourceBadge source={account.source} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">{isCard ? 'Balance owed' : 'Balance'}</p>
          <p className={isCard ? 'text-3xl font-semibold tracking-tight tabular-nums text-destructive' : 'text-3xl font-semibold tracking-tight tabular-nums'}>
            {isCard ? '−' : ''}{formatCents(account.balanceCents)}
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Detail term="Account type">{label(ACCOUNT_TYPE_LABELS, account.type)}</Detail>
          {isCard && isCents(account.creditLimitCents) && <Detail term="Credit limit">{formatCents(account.creditLimitCents, { whole: true })}</Detail>}
          {account.annualRateBps ? <Detail term={account.type === 'cd' ? 'Rate (APY)' : 'APY'}>{formatBps(account.annualRateBps)}</Detail> : null}
          {account.maturityDate && <Detail term="Matures">{formatDay(account.maturityDate)}</Detail>}
          {account.riskLevel && <Detail term="Risk level"><span className="capitalize">{account.riskLevel}</span></Detail>}
          {account.holdingsNote && <Detail term="Holdings">{account.holdingsNote}</Detail>}
        </dl>
        {countsAs(account.type) && <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{countsAs(account.type)}</p>}
        <div className="flex flex-wrap gap-2">
          {isLongTerm && (
            <Link to={profilePath(slug, 'investments')} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
              Open Investment Planner <ArrowRight />
            </Link>
          )}
          <p className="self-center text-xs text-muted-foreground">Read-only. Change balances with <strong>Edit data</strong> in the header.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Accounts() {
  const { slug, overview } = useCurrentProfile()
  const { accountId } = useParams()
  const accounts = overview.accounts || []
  const account = accountId ? accounts.find((a) => String(a.id) === String(accountId)) : defaultAccount(accounts)
  const cash = overview.cash || {}

  const crumbs = [
    { label: 'Overview', to: profilePath(slug) },
    { label: 'Accounts', to: account || accountId ? profilePath(slug, 'accounts') : undefined },
    ...(account ? [{ label: account.name }] : accountId ? [{ label: 'Not found' }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader overview={overview} breadcrumbs={crumbs} />

      <section aria-label="Account totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Available cash"
          icon={Wallet}
          tone="primary"
          value={formatCents(cash.availableCashCents)}
          sub={`Checking ${formatCents(cash.checkingCents, { whole: true })} · Savings ${formatCents(cash.savingsCents, { whole: true })}`}
        />
        <StatCard
          label="Credit card balances"
          icon={CreditCard}
          value={formatCents(cash.creditCardDebtCents)}
          sub={isCents(cash.unusedCreditCents) ? `${formatCents(cash.unusedCreditCents, { whole: true })} unused credit — not cash` : 'Unused credit is not cash'}
        />
        <StatCard
          label="Long-term holdings"
          icon={PiggyBank}
          tone="muted"
          to={profilePath(slug, 'investments')}
          linkLabel="Open Investment Planner"
          value={formatCents(cash.longTermCents)}
          sub="Retirement, investments & CDs — not spendable."
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AccountsList
            accounts={accounts}
            slug={slug}
            selectedId={account?.id}
            title="Your accounts"
            description="Select an account to see its details and transactions."
          />
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {account ? (
            <AccountDetails account={account} slug={slug} />
          ) : accountId ? (
            <Card className="p-6">
              <EmptyState icon={SearchX} title="Account not found">
                This account does not belong to {overview.profile?.displayName || 'this demo customer'}. Account ids differ between the fictional customers.
              </EmptyState>
              <div className="mt-4 flex justify-center">
                <Link to={profilePath(slug, 'accounts')} className={buttonClasses({ variant: 'outline' })}>Back to accounts</Link>
              </div>
            </Card>
          ) : (
            <EmptyState title="No accounts on file" />
          )}
        </div>
      </div>

      {/* Full width so every column (incl. cash impact) fits beside the sidebar without an inner scroll. */}
      {account && (
        <TransactionsTable
          key={account.id}
          slug={slug}
          accounts={accounts}
          accountId={String(account.id)}
          title={`Transactions · ${account.name}`}
          emptyTitle={emptyCopy(account.type).title}
          emptyText={emptyCopy(account.type).text}
        />
      )}
    </div>
  )
}
