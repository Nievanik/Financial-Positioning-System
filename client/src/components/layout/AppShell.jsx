import { Calculator, LayoutDashboard, PieChart } from 'lucide-react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { EditDataButton } from '@/components/edit/EditDataButton'
import { cn } from '@/lib/utils'
import { DataSourceBadge } from './DataSourceBadge'
import { ProfileSwitcher } from './ProfileSwitcher'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'simulate', label: 'Cash-Flow Simulator', short: 'Simulator', icon: Calculator },
  { to: 'investments', label: 'Investment Planner', short: 'Investments', icon: PieChart },
]

function Nav({ slug, className }) {
  return (
    <nav aria-label="Main" className={cn('flex gap-1', className)}>
      {NAV.map(({ to, label, short, icon: Icon, end }) => (
        <NavLink
          key={label}
          to={`/p/${slug}${to ? `/${to}` : ''}`}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon className="size-4" aria-hidden />
          <span className="hidden xl:inline">{label}</span>
          <span className="xl:hidden">{short || label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppShell() {
  const { slug } = useParams()
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-foreground px-4 py-1.5 text-center text-xs text-background">
        Demo with <strong>fictional people and synthetic data</strong> (Capital One Nessie sandbox + labeled supplements). Forecasts are estimates — not financial advice or a loan decision.
      </div>
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span>
              FPS<span className="hidden text-muted-foreground sm:inline"> · Financial Positioning System</span>
            </span>
          </Link>
          {slug && <Nav slug={slug} className="hidden lg:flex" />}
          <div className="ml-auto flex items-center gap-2">
            <DataSourceBadge />
            {slug && <EditDataButton slug={slug} />}
            <ProfileSwitcher />
            <ThemeToggle />
          </div>
          {slug && <Nav slug={slug} className="-mx-1 w-full overflow-x-auto px-1 lg:hidden" />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <p className="mx-auto max-w-7xl px-4 text-xs text-muted-foreground">
          FPS is a HackUTD 2026 prototype. All customers, accounts and transactions are synthetic. Projections are deterministic estimates from
          the data shown, not guarantees, loan approvals or investment advice. FPS never moves money, places trades or sends notifications. Profile
          edits change only this shared synthetic demo data.
        </p>
      </footer>
    </div>
  )
}
