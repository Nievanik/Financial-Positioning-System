import { ArrowRight, CalendarClock, Landmark, ListOrdered } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SourceBadge } from '@/components/financial/SourceBadge'
import { EmptyState } from '@/components/financial/StateViews'
import { StatCard } from '@/components/financial/StatCard'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentProfile } from '@/features/profiles/useCurrentProfile'
import { formatDay } from '@/lib/dates'
import { label, LOAN_TYPE_LABELS } from '@/lib/labels'
import { formatBps, formatCents } from '@/lib/money'
import { loanPaymentFlow, profilePath } from '@/lib/navigation'
import { PageHeader } from './Dashboard'

/**
 * Loans (docs/design.md 6b): server values from GET /overview only — balance, APR, monthly payment, due day
 * and the next due date of the loan's single payment flow. No interest, payoff or amortisation math.
 */
function LoanCard({ loan, flow }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label(LOAN_TYPE_LABELS, loan.loanType)} loan</CardDescription>
        <CardTitle as="h2" className="flex flex-wrap items-center gap-2 text-lg">
          {loan.name} <SourceBadge source={loan.source} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Outstanding balance</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-destructive">−{formatCents(loan.outstandingCents)}</p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">APR</dt>
            <dd className="text-sm font-medium tabular-nums">{loan.annualRateBps ? formatBps(loan.annualRateBps) : 'Not provided'}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Monthly payment</dt>
            <dd className="text-sm font-medium tabular-nums">{formatCents(loan.monthlyPaymentCents)}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className="text-sm font-medium">Day {loan.dueDay} of each month</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Next payment</dt>
            <dd className="text-sm font-medium">{flow?.nextDate ? formatDay(flow.nextDate) : 'Not scheduled'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export default function Loans() {
  const { slug, overview } = useCurrentProfile()
  const loans = overview.loans || []
  const rows = loans.map((loan) => ({ loan, flow: loanPaymentFlow(loan, overview.obligations) }))
  const next = rows.filter((r) => r.flow?.nextDate).sort((a, b) => String(a.flow.nextDate).localeCompare(String(b.flow.nextDate)))[0]

  return (
    <div className="space-y-6">
      <PageHeader overview={overview} breadcrumbs={[{ label: 'Overview', to: profilePath(slug) }, { label: 'Loans' }]}>
        <Link to={profilePath(slug, 'simulate')} className={buttonClasses({ variant: 'outline' })}>
          Test a change in the simulator <ArrowRight />
        </Link>
      </PageHeader>

      <section aria-label="Loan totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loans outstanding" icon={Landmark} value={formatCents(overview.cash?.loanDebtCents)} sub="Total owed across all loans" />
        <StatCard label="Loans on file" icon={ListOrdered} value={String(loans.length)} sub="Each shown below with APR, payment and due date" />
        <StatCard
          label="Next loan payment"
          icon={CalendarClock}
          value={next ? formatCents(next.flow.amountCents ?? next.loan.monthlyPaymentCents) : '—'}
          sub={next ? `${next.loan.name} · due ${formatDay(next.flow.nextDate)}` : 'No upcoming loan payment scheduled'}
        />
      </section>

      {rows.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {rows.map(({ loan, flow }) => <LoanCard key={loan.id} loan={loan} flow={flow} />)}
        </div>
      ) : (
        <EmptyState icon={Landmark} title="No loans on file for this customer" />
      )}

      <Card className="p-5 text-sm text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>Each loan payment is scheduled <strong className="text-foreground">once</strong> in the cash-flow forecast; the loan record itself is not subtracted again.</li>
          <li>Balances, rates and payments are synthetic demo data. Change them with <strong className="text-foreground">Edit data</strong> in the header.</li>
          <li>FPS does not make payments, quote payoff amounts, or offer refinancing or loan approvals.</li>
        </ul>
      </Card>
    </div>
  )
}
