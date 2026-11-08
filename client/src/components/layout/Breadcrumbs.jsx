import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/** `items`: [{ label, to? }]; the last item is the current page (no link, aria-current). */
export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
              {last || !item.to ? (
                <span aria-current={last ? 'page' : undefined} className={last ? 'truncate text-foreground' : 'truncate'}>{item.label}</span>
              ) : (
                <Link to={item.to} className="truncate rounded-sm hover:text-foreground hover:underline">{item.label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
