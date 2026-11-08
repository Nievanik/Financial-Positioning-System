import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cardLinkClass, linkedCardClass } from './cardLink'

/** A headline figure. With `to`, the whole card is a link (see cardLink.js). */
export function StatCard({ label, value, sub, icon: Icon, tone = 'default', footer, className, to, linkLabel }) {
  const toneClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground',
  }[tone]
  return (
    <Card className={cn('flex flex-col gap-2 p-5', to && linkedCardClass, className)}>
      <div className="flex items-center justify-between gap-2">
        {to ? (
          <Link to={to} data-card-link aria-label={linkLabel ? `${label}: ${linkLabel}` : undefined} className={cn('text-sm font-medium text-muted-foreground', cardLinkClass)}>
            {label}
          </Link>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        )}
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <p className={cn('text-2xl font-semibold tracking-tight tabular-nums', toneClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {footer}
      {to && linkLabel && (
        <p className="mt-auto inline-flex items-center gap-0.5 pt-1 text-xs font-medium text-primary" aria-hidden>
          {linkLabel} <ChevronRight className="size-3.5" />
        </p>
      )}
    </Card>
  )
}
