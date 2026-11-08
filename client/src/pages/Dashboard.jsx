import { Calculator, PieChart, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountsList } from '@/components/financial/AccountsList'
import { IndicatorCard } from '@/components/financial/IndicatorCard'
import { ObligationsList } from '@/components/financial/ObligationsList'
import { OverviewCards } from '@/components/financial/OverviewCards'
import { RecommendationList } from '@/components/financial/RecommendationList'
import { AsyncSection, EmptyState, LoadingCard } from '@/components/financial/StateViews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForecastSection } from '@/features/forecast/ForecastSection'
import { ShortfallAlert } from '@/features/forecast/ShortfallAlert'
import { useCurrentProfile } from '@/features/profiles/useCurrentProfile'
import { useForecast, useHealthMetrics, useRecommendations, useSpending } from '@/features/profiles/useProfileData'
import { SpendingSection } from '@/features/spending/SpendingSection'
import { TransactionsTable } from '@/features/spending/TransactionsTable'
import { formatDay, formatTimestamp } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { creditCardTarget, profilePath } from '@/lib/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

/** Where each health indicator links (docs/design.md section 4). */
const INDICATOR_LINKS = {
  emergency_coverage: { section: 'accounts', label: 'View accounts' },
  debt_payment_burden: { section: 'loans', label: 'View loans' },
  cash_flow_safety: { section: 'simulate', label: 'Run a what-if' },
}

export function PageHeader({ overview, title, breadcrumbs, children }) {
  const p = overview.profile || {}
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : <p className="text-sm text-muted-foreground">{title}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{p.displayName}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {p.tagline && <span>{p.tagline}</span>}
          <Badge variant="outline">Snapshot as of {formatDay(overview.asOf)}</Badge>
          <Badge variant="outline">
            {p.lastSyncedAt ? `Synced from Nessie ${formatTimestamp(p.lastSyncedAt, p.timeZone)}` : 'Not yet synced from Nessie'}
          </Badge>
          <Badge variant="synthetic">Fictional customer</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const { slug, overview } = useCurrentProfile()
  const navigate = useNavigate()
  const forecast = useForecast(slug)
  const health = useHealthMetrics(slug)
  const spending = useSpending(slug, 3)
  const recs = useRecommendations(slug)

  const tryScenario = (action) => navigate(`/p/${slug}/simulate`, { state: { prefill: action } })
  const refreshAll = () => [forecast, health, spending, recs].forEach((q) => q.reload())

  return (
    <div className="space-y-6">
      <PageHeader overview={overview} title="Financial dashboard">
        <Button variant="ghost" size="sm" onClick={refreshAll} aria-label="Refresh dashboard data">
          <RefreshCw /> Refresh
        </Button>
        <Link to={`/p/${slug}/investments`} className={buttonClasses({ variant: 'outline' })}>
          <PieChart /> Investments
        </Link>
        <Link to={`/p/${slug}/simulate`} className={buttonClasses()}>
          <Calculator /> Run a what-if
        </Link>
      </PageHeader>

      {forecast.data && (
        <ShortfallAlert shortfalls={forecast.data.shortfalls} asOf={forecast.data.asOf} floorCents={forecast.data.assumptions?.cashFloorCents} slug={slug} />
      )}

      <section aria-label="Financial overview" className="space-y-2">
        <OverviewCards
          cash={overview.cash}
          links={{
            cash: profilePath(slug, 'accounts'),
            card: creditCardTarget(slug, overview.accounts),
            loans: profilePath(slug, 'loans'),
            longTerm: profilePath(slug, 'investments'),
          }}
        />
        {typeof overview.cash?.netWorthCents === 'number' && (
          <p className="text-right text-xs text-muted-foreground">
            <Link to={profilePath(slug, 'accounts')} className="rounded-sm hover:text-foreground hover:underline">
              Net worth (assets − card and loan balances): <span className="font-medium text-foreground">{formatCents(overview.cash.netWorthCents)}</span>
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="health-heading" className="space-y-3">
        <h2 id="health-heading" className="text-lg font-semibold">Financial health</h2>
        <AsyncSection query={health} loading={<div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <LoadingCard key={i} />)}</div>}>
          {(h) =>
            h.indicators?.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {h.indicators.map((ind) => {
                  const link = INDICATOR_LINKS[ind.id]
                  return <IndicatorCard key={ind.id} indicator={ind} to={link ? profilePath(slug, link.section) : undefined} linkLabel={link?.label} />
                })}
              </div>
            ) : (
              <EmptyState title="No health indicators available" />
            )
          }
        </AsyncSection>
      </section>

      <ForecastSection slug={slug} query={forecast} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><SpendingSection query={spending} /></div>
        <div className="lg:col-span-2">
          <ObligationsList obligations={overview.obligations} income={overview.income} slug={slug} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Next-best actions</CardTitle>
              <CardDescription>Each impact is calculated by re-running the same forecast with the change applied.</CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncSection query={recs} loading={<LoadingCard lines={4} className="border-0 shadow-none" />}>
                {(r) => <RecommendationList recommendations={r.recommendations} onTry={tryScenario} />}
              </AsyncSection>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <AccountsList accounts={overview.accounts} loans={overview.loans} slug={slug} />
        </div>
      </div>

      <TransactionsTable slug={slug} accounts={overview.accounts} />
    </div>
  )
}
