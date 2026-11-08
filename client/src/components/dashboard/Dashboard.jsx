import { Panel, Skeleton } from '@/components/layout/Panel'
import { useApi } from '@/hooks/useApi'
import { firstName, formatDate, greeting } from '@/lib/format'
import { StatCards } from './StatCards'
import { BalancesPanel } from './BalancesPanel'
import { UpcomingPanel } from './UpcomingPanel'
import { ForecastPanel } from './ForecastPanel'
import { HealthPanel } from './HealthPanel'

// Placeholder body; each later step in docs/design.md Part D swaps one of these for the real panel.
const Todo = ({ step }) => <p className="text-[11px] text-muted-foreground">Built in step {step}.</p>

export function Dashboard({ profile }) {
  const base = profile && `/profiles/${profile.slug}`
  const overview = useApi(base && `${base}/overview`)
  const month = useApi(base && `${base}/spending?months=1`)
  const quarter = useApi(base && `${base}/spending?months=3`)
  const forecast = useApi(base && `${base}/forecast`)
  const health = useApi(base && `${base}/health-metrics`)
  const explanation = useApi(base && `${base}/explanations`, { subject: 'forecast' })

  return (
    <div id="overview" className="mx-auto max-w-[1420px] scroll-mt-6 px-3 pt-6 pb-[35px] sm:px-4 md:px-[38px] md:pt-8 md:pb-[50px]">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <div className="text-[11px] font-[750] tracking-[1.1px] text-teal uppercase">Your financial snapshot</div>
          <h1 className="mt-[5px] mb-[3px] text-[23px] font-bold tracking-[-0.7px] md:text-[27px]">
            {profile ? `${greeting()}, ${firstName(profile.displayName)}` : <Skeleton className="h-8 w-64" />}
          </h1>
          <p className="text-muted-foreground">Here’s where things stand and what’s coming up.</p>
        </div>
        {profile?.lastSyncedAt && (
          <div className="hidden pt-2 text-[12px] text-muted-foreground md:block">
            Synced {formatDate(profile.lastSyncedAt)} · Demo data
          </div>
        )}
      </div>

      <StatCards overview={overview} month={month} quarter={quarter} />

      <div className="mb-[17px] grid gap-[17px] md:grid-cols-[minmax(0,1.4fr)_minmax(260px,.9fr)] lg:grid-cols-[minmax(0,1.72fr)_minmax(280px,.9fr)]">
        <ForecastPanel forecast={forecast} explanation={explanation} />
        <HealthPanel health={health} forecast={forecast} />
      </div>

      <div className="mb-[17px] grid gap-[17px] md:grid-cols-[minmax(0,1.4fr)_minmax(260px,.9fr)] lg:grid-cols-[minmax(0,1.72fr)_minmax(280px,.9fr)]">
        <BalancesPanel overview={overview} />
        <UpcomingPanel overview={overview} />
      </div>

      <div className="grid gap-[17px] md:grid-cols-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)_minmax(250px,.85fr)]">
        <Panel id="spending" title="Spending breakdown" sub="Last 30 days · by category">
          <Todo step={5} />
        </Panel>
        <Panel id="transactions" title="Recent transactions" sub="Latest activity across accounts">
          <Todo step={5} />
        </Panel>
        <section
          id="scenario"
          aria-labelledby="scenario-title"
          className="scroll-mt-6 rounded-[13px] border border-navy bg-navy p-4 text-white shadow-card md:col-span-2 md:p-[19px] lg:col-span-1"
        >
          <h2 id="scenario-title" className="mb-[3px] text-[15px] font-bold tracking-[-0.2px]">Try a what-if</h2>
          <p className="text-[11px] text-[#b8c6d6]">See how a decision could affect your cash</p>
          <p className="mt-4 text-[11px] text-[#b8c6d6]">Built in step 6.</p>
        </section>
      </div>

      <p className="pt-5 text-center text-[10px] text-[#9aa4b1]">
        Synthetic demo data · Not connected to a live financial account · Estimates, not financial advice
      </p>
    </div>
  )
}
