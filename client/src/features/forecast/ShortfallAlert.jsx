import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { daysBetween, formatDay } from '@/lib/dates'
import { formatCents } from '@/lib/money'

/** Flags ANY forecast day below the cash floor — even if the month-end balance recovers. */
export function ShortfallAlert({ shortfalls = [], asOf, floorCents = 0, slug, compact = false }) {
  if (!shortfalls.length) return null
  const first = shortfalls[0]
  const deepest = shortfalls.reduce((m, s) => (s.cashCents < m.cashCents ? s : m), first)
  const away = asOf ? daysBetween(asOf, first.date) : null
  return (
    <Alert
      variant="destructive"
      title={`Projected cash shortfall starting ${formatDay(first.date, 'long')}${away !== null ? ` (${away} days away)` : ''}`}
      action={
        slug && !compact ? (
          <Link to={`/p/${slug}/simulate`} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
            Test a fix
          </Link>
        ) : null
      }
    >
      Available cash falls below your {formatCents(floorCents, { whole: true })} floor on {shortfalls.length} day
      {shortfalls.length === 1 ? '' : 's'} in the next six months, as low as {formatCents(deepest.cashCents, { whole: true })} on{' '}
      {formatDay(deepest.date)} — even where month-end balances look fine.
    </Alert>
  )
}
