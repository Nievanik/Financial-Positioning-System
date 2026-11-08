import { useCallback, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ErrorNote } from '@/components/layout/Panel'
import { Dashboard } from '@/components/dashboard/Dashboard'

// Selected profile lives in ?profile=slug so a reload or shared link keeps it.
const slugFromUrl = () => new URLSearchParams(window.location.search).get('profile')

export default function App() {
  const profiles = useApi('/profiles')
  const [chosen, setChosen] = useState(slugFromUrl)
  const [active, setActive] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const list = profiles.data?.profiles
  const profile = list?.find((p) => p.slug === chosen) ?? list?.[0]

  const chooseProfile = (slug) => {
    setChosen(slug)
    const url = new URL(window.location.href)
    url.searchParams.set('profile', slug)
    window.history.replaceState(null, '', url)
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[236px_minmax(0,1fr)]">
      <Sidebar
        profile={profile}
        active={active}
        onNavigate={(id) => { setActive(id); closeMenu() }}
        open={menuOpen}
        onClose={closeMenu}
      />
      <main className="min-w-0">
        <Topbar
          profiles={list}
          slug={profile?.slug}
          onProfileChange={chooseProfile}
          active={active}
          menuOpen={menuOpen}
          onMenu={() => setMenuOpen(true)}
        />
        {profiles.error ? (
          <div className="mx-auto max-w-[1420px] px-4 pt-8 md:px-[38px]">
            <ErrorNote error={profiles.error} onRetry={profiles.retry} />
          </div>
        ) : list?.length === 0 ? (
          <p className="px-4 pt-8 text-muted-foreground md:px-[38px]">
            No demo profiles found. Run <code>npm run sync:nessie</code> in <code>server/</code>.
          </p>
        ) : (
          <Dashboard key={profile?.slug} profile={profile} />
        )}
      </main>
    </div>
  )
}
