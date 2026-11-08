import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { EditDataButton } from '@/components/edit/EditDataButton'
import { activeSection, profilePath } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { DataSourceBadge } from './DataSourceBadge'
import { NAV_GROUPS, NAV_ITEMS } from './navItems'
import { ProfileSwitcher } from './ProfileSwitcher'
import { ThemeToggle } from './ThemeToggle'

/**
 * Active state comes from the section (lib/navigation.js), so "Accounts" stays active on /accounts/:id and
 * "Overview" is active only on the dashboard. Plain Link (not NavLink) so aria-current is set exactly once.
 */
function useActive(slug) {
  const { pathname } = useLocation()
  return slug ? activeSection(pathname, slug) : null
}

const itemClass = (active) =>
  cn(
    'inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors',
    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

/** Desktop (lg+): grouped sticky sidebar (docs/design.md section 3). */
function Sidebar({ slug }) {
  const active = useActive(slug)
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-16 flex max-h-[calc(100vh-4rem)] flex-col gap-5 overflow-y-auto py-6 pr-2">
        <nav aria-label="Main" className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group}>
              <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
              <ul className="flex flex-col gap-0.5">
                {NAV_ITEMS.filter((i) => i.group === group).map(({ id, path, label, icon: Icon }) => (
                  <li key={id}>
                    <Link to={profilePath(slug, path)} aria-current={active === id ? 'page' : undefined} className={cn(itemClass(active === id), 'w-full')}>
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="border-t px-3 pt-4 text-xs text-muted-foreground">Demo environment • Synthetic data</p>
      </div>
    </aside>
  )
}

/** Mobile/tablet (< lg): scrollable tab row under the header. */
function MobileNav({ slug }) {
  const active = useActive(slug)
  return (
    <nav aria-label="Main" className="border-t lg:hidden">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5">
        {NAV_ITEMS.map(({ id, path, label, short, icon: Icon }) => (
          <li key={id} className="shrink-0">
            <Link to={profilePath(slug, path)} aria-current={active === id ? 'page' : undefined} className={itemClass(active === id)}>
              <Icon className="size-4" aria-hidden />
              {short || label}
            </Link>
          </li>
        ))}
      </ul>
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
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <DataSourceBadge />
            {slug && <EditDataButton slug={slug} />}
            <ProfileSwitcher />
            <ThemeToggle />
          </div>
        </div>
        {slug && <MobileNav slug={slug} />}
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4">
        {slug && <Sidebar slug={slug} />}
        <main className="min-w-0 flex-1 py-6">
          <Outlet />
        </main>
      </div>
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
