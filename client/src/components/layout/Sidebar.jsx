import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'
import { NAV } from './nav'

const SectionTitle = ({ children }) => (
  <div className="px-3 pb-[9px] text-[10px] font-bold tracking-[1.1px] text-nav-title uppercase">{children}</div>
)

// Desktop: fixed 236px column. Mobile (<761px): hidden until `open`, then a drawer over a backdrop.
export function Sidebar({ profile, active, onNavigate, open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && <button aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-30 bg-ink/30 md:hidden" />}
      <aside
        id="sidebar"
        className={cn(
          'flex-col gap-8 border-r border-line bg-paper px-4 py-[25px]',
          open ? 'fixed inset-y-0 left-0 z-40 flex w-[236px] overflow-y-auto shadow-card' : 'hidden',
          'md:sticky md:top-0 md:flex md:h-screen md:shadow-none',
        )}
      >
        <div className="flex items-center gap-[11px] px-2.5 text-[17px] font-[750] tracking-[-0.4px]">
          <span className="grid size-[34px] place-items-center rounded-[11px] bg-navy text-[15px] text-white">F</span>
          FPS<span className="font-medium text-[#91a0b2]">/</span>
        </div>

        {NAV.map((group) => (
          <div key={group.title}>
            <SectionTitle>{group.title}</SectionTitle>
            <nav aria-label={group.title} className="grid gap-[5px]">
              {group.items.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => onNavigate(id)}
                  aria-current={active === id ? 'location' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-[9px] px-3 py-2.5 font-[550] text-nav-link no-underline hover:bg-nav-hover',
                    active === id && 'bg-nav-active font-bold text-navy hover:bg-nav-active',
                  )}
                >
                  <Icon aria-hidden className="size-4" strokeWidth={2} />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-auto">
          <SectionTitle>Demo profile</SectionTitle>
          <div className="flex items-center gap-2.5 border-t border-line px-[9px] pt-[18px]">
            <div className="grid size-9 flex-none place-items-center rounded-full bg-avatar font-bold text-navy">
              {initials(profile?.displayName)}
            </div>
            <div className="min-w-0 leading-tight">
              <b className="block truncate">{profile?.displayName ?? '—'}</b>
              <small className="text-muted-foreground">Sample customer</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
