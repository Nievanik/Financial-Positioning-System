import { ArrowLeft, DatabaseZap, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IllustrativeBadge } from '@/components/financial/SourceBadge'
import { AsyncSection, EmptyState, LoadingCard } from '@/components/financial/StateViews'
import { Alert } from '@/components/ui/alert'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountDrilldown } from '@/features/investments/AccountDrilldown'
import { AllocationPlanner } from '@/features/investments/AllocationPlanner'
import { CdTimeline } from '@/features/investments/CdTimeline'
import { PortfolioPie } from '@/features/investments/PortfolioPie'
import { ProposedPlans } from '@/features/investments/ProposedPlans'
import {
  useInvestmentAssumptions,
  useInvestmentCds,
  useInvestmentPlans,
  useInvestmentPortfolio,
} from '@/features/investments/useInvestmentData'
import { useCurrentProfile } from '@/features/profiles/useCurrentProfile'
import { formatCents } from '@/lib/money'
import { PageHeader } from './Dashboard'

export default function Investments() {
  const { slug, overview } = useCurrentProfile()
  const portfolio = useInvestmentPortfolio(slug)
  const cds = useInvestmentCds(slug)
  const plans = useInvestmentPlans(slug)
  const assumptions = useInvestmentAssumptions()
  const [picked, setPicked] = useState(null)
  const selected = picked ?? portfolio.data?.groups?.find((g) => g.totalCents > 0)?.id ?? null
  const storageNote = plans.data?.storage?.note || cds.data?.storage?.note

  return (
    <div className="space-y-6">
      <PageHeader overview={overview} title="Investment planner">
        <Link to={`/p/${slug}`} className={buttonClasses({ variant: 'ghost' })}>
          <ArrowLeft /> Dashboard
        </Link>
      </PageHeader>

      <Alert variant="warning" title="Educational simulation — not investment advice">
        Balances come from the profile’s synthetic accounts. Returns, risk swings and renewal rates on this page are hypothetical assumptions from the FPS
        server for illustration. FPS does not place trades, move money, renew CDs or send notifications; approvals are only recorded.
      </Alert>

      <AsyncSection query={portfolio} loading={<LoadingCard chart />}>
        {(pf) => (
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Long-term holdings</CardTitle>
                <CardDescription>Investments, retirement accounts and CDs — kept separate from spendable cash.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {pf.groups?.length ? (
                  <>
                    <PortfolioPie portfolio={pf} selected={selected} onSelect={setPicked} />
                    <AccountDrilldown portfolio={pf} groupId={selected} />
                  </>
                ) : (
                  <EmptyState title="No investment, retirement or CD accounts">This profile holds only cash and credit accounts.</EmptyState>
                )}
              </CardContent>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Liquid cash (not in chart)</p>
                <Wallet className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">{formatCents(pf.liquidCash?.availableCashCents)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{pf.liquidCash?.note}</p>
              <Link to={`/p/${slug}`} className={buttonClasses({ variant: 'link', size: 'sm', className: 'mt-1 h-auto' })}>
                See the cash forecast →
              </Link>
            </Card>
          </div>
        )}
      </AsyncSection>

      <Card>
        <CardHeader>
          <CardTitle>CD maturity timeline</CardTitle>
          <CardDescription>Upcoming maturities and the decision each one needs before anything happens.</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncSection query={cds} loading={<LoadingCard lines={4} className="border-0 shadow-none" />}>
            {(data) => <CdTimeline slug={slug} data={data} onChanged={cds.reload} />}
          </AsyncSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Try an allocation <IllustrativeBadge>Hypothetical scenarios</IllustrativeBadge>
          </CardTitle>
          <CardDescription>
            Move a slider and the others rebalance so the mix always totals 100%. The FPS server calculates outcomes from fixed illustrative returns — not predictions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncSection query={assumptions} loading={<LoadingCard chart className="border-0 shadow-none" />}>
            {(a) => <AllocationPlanner slug={slug} assumptions={a} suggestedAmountCents={portfolio.data?.totalLongTermCents} onSaved={plans.reload} />}
          </AsyncSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposed plans</CardTitle>
          <CardDescription>Each needs your explicit approval or rejection — nothing is executed either way.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageNote && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DatabaseZap className="size-3.5" aria-hidden /> {storageNote}
            </p>
          )}
          <AsyncSection query={plans} loading={<LoadingCard lines={3} className="border-0 shadow-none" />}>
            {(data) => (
              <ProposedPlans slug={slug} plans={data.plans || []} assetClasses={assumptions.data?.assetClasses || []} onChanged={plans.reload} />
            )}
          </AsyncSection>
        </CardContent>
      </Card>
    </div>
  )
}
