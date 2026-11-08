import { Menu } from 'lucide-react'
import { NAV } from './nav'

const LABELS = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.id, i.label])))

export function Topbar({ profiles, slug, onProfileChange, active, menuOpen, onMenu }) {
  return (
    <header className="flex h-[60px] items-center justify-between gap-3 border-b border-line bg-white/72 px-[18px] md:h-[72px] md:px-[38px]">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          className="-ml-1.5 grid size-8 place-items-center rounded-md text-strong md:hidden"
        >
          <Menu className="size-[18px]" />
        </button>
        <span className="truncate">
          Workspace&ensp;/&ensp;<strong className="text-strong">{LABELS[active] ?? 'Overview'}</strong>
        </span>
      </div>
      <select
        aria-label="Demo profile"
        value={slug ?? ''}
        disabled={!profiles?.length}
        onChange={(e) => onProfileChange(e.target.value)}
        className="max-w-[185px] rounded-lg border border-line bg-white p-2 text-[11px] text-[#405067] md:max-w-none md:px-3 md:py-[9px] md:text-sm"
      >
        {!profiles?.length && <option value="">Loading profiles…</option>}
        {profiles?.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.displayName} · Sample profile
          </option>
        ))}
      </select>
    </header>
  )
}
