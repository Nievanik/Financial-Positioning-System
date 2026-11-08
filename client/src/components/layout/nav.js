import { ArrowUpDown, ChartPie, Diamond, HeartPulse, LayoutGrid, TrendingUp } from 'lucide-react'

// Sidebar groups; ids are the page section anchors.
export const NAV = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutGrid },
      { id: 'forecast', label: 'Cash flow', icon: TrendingUp },
      { id: 'spending', label: 'Spending', icon: ChartPie },
      { id: 'transactions', label: 'Transactions', icon: ArrowUpDown },
    ],
  },
  {
    title: 'Your plan',
    items: [
      { id: 'health', label: 'Financial health', icon: HeartPulse },
      { id: 'scenario', label: 'What-if planner', icon: Diamond },
    ],
  },
]
