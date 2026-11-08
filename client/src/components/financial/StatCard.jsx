import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, sub, icon: Icon, tone = 'default', footer, className }) {
  const toneClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground',
  }[tone]
  return (
    <Card className={cn('flex flex-col gap-2 p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <p className={cn('text-2xl font-semibold tracking-tight tabular-nums', toneClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {footer}
    </Card>
  )
}
