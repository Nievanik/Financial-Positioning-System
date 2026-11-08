import { Calculator, Landmark, LayoutDashboard, PieChart, Wallet } from 'lucide-react'
import { SECTIONS } from '@/lib/navigation'

const ICONS = { overview: LayoutDashboard, accounts: Wallet, loans: Landmark, simulate: Calculator, investments: PieChart }

/** Sidebar / mobile-tab items (docs/design.md section 3): SECTIONS plus their Lucide icons. */
export const NAV_ITEMS = SECTIONS.map((s) => ({ ...s, icon: ICONS[s.id] }))
export const NAV_GROUPS = [...new Set(NAV_ITEMS.map((i) => i.group))]
