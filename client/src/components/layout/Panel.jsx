import { cn } from '@/lib/utils'

// Card shell from the design (.card.panel): white, 13px radius, line border, soft shadow.
export function Panel({ id, title, sub, action, className, children }) {
  return (
    <section
      id={id}
      aria-labelledby={id && title ? `${id}-title` : undefined}
      className={cn('scroll-mt-6 rounded-[13px] border border-line bg-paper p-4 shadow-card md:p-5', className)}
    >
      {title && (
        <div className="mb-[17px] flex items-start justify-between gap-3">
          <div>
            <h2 id={id && `${id}-title`} className="mb-[3px] text-[15px] font-bold tracking-[-0.2px]">{title}</h2>
            {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Skeleton({ className }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-lg bg-track', className)} />
}

// Inline error with retry, used inside any card whose request failed.
export function ErrorNote({ error, onRetry }) {
  const message = error?.status === 429 ? 'Too many requests. Try again in a minute.' : error?.message || 'Something went wrong.'
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-[10px] bg-red-pale px-3 py-2.5 text-[12px] text-red">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded-md px-2 py-1 font-semibold underline-offset-2 hover:underline">
          Retry
        </button>
      )}
    </div>
  )
}

// Design .meter: 5px track; `tone` warn = amber fill, bad = red fill.
export function Meter({ value, tone = 'good', label }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div role="meter" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="h-[5px] overflow-hidden rounded-[9px] bg-track">
      <i className={cn('block h-full rounded-[9px]', tone === 'warn' ? 'bg-[#e3a33e]' : tone === 'bad' ? 'bg-red' : 'bg-teal')} style={{ width: `${pct}%` }} />
    </div>
  )
}
