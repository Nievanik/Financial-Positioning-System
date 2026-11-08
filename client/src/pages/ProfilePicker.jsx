import { ArrowRight, Calculator, LineChart, PieChart, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingCard } from '@/components/financial/StateViews'
import { Card } from '@/components/ui/card'
import { useProfiles } from '@/features/profiles/useProfileData'
import { formatTimestamp } from '@/lib/dates'

const STEPS = [
  { icon: ShieldCheck, title: 'Understand', text: 'Cash, debt, savings and retirement in one view — without mixing them up.' },
  { icon: LineChart, title: 'Predict', text: 'A deterministic day-by-day cash forecast with month-end checkpoints and shortfall alerts.' },
  { icon: Calculator, title: 'Optimize', text: 'Test a purchase or commitment and compare it against your baseline.' },
  { icon: PieChart, title: 'Plan', text: 'Explore long-term accounts and hypothetical allocations — nothing executes.' },
]

export default function ProfilePicker() {
  const query = useProfiles()
  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl pt-6 text-center">
        <p className="text-sm font-medium text-primary">PNC 360° Financial Health Navigator · Capital One Nessie</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Can I afford this decision — and what is my smartest next move?
        </h1>
        <p className="mt-3 text-muted-foreground text-balance">
          Pick one of three fictional customers to explore their finances. No login, nothing to enter, nothing saved.
        </p>
      </section>

      <section aria-labelledby="profiles-heading">
        <h2 id="profiles-heading" className="sr-only">Demo profiles</h2>
        {query.loading && !query.data ? (
          <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <LoadingCard key={i} lines={2} />)}</div>
        ) : query.error ? (
          <ErrorState error={query.error} onRetry={query.reload} title="Could not load demo profiles" />
        ) : !query.data?.profiles?.length ? (
          <EmptyState title="No demo profiles found">Run the server seed script to create the three demo profiles.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {query.data.profiles.map((p) => (
              <Link key={p.slug} to={`/p/${p.slug}`} className="group rounded-xl focus-visible:outline-2">
                <Card className="flex h-full flex-col gap-3 p-6 transition-shadow group-hover:shadow-md group-hover:border-primary/50">
                  <div className="flex size-11 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                    {p.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{p.displayName}</p>
                    {p.tagline && <p className="text-sm text-muted-foreground">{p.tagline}</p>}
                  </div>
                  <p className="mt-auto text-xs text-muted-foreground">
                    {p.lastSyncedAt ? `Synced from Nessie ${formatTimestamp(p.lastSyncedAt)}` : 'Not yet synced'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open dashboard <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card/60 p-5">
            <Icon className="size-5 text-primary" aria-hidden />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
