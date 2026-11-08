import { useId } from 'react'
import { cn } from '@/lib/utils'

const base =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 aria-[invalid=true]:border-destructive'

export function Input({ className, ...props }) {
  return <input className={cn(base, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(base, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium', className)} {...props} />
}

/** Label + control + hint/error, wiring ids for accessibility. */
export function Field({ label, hint, error, prefix, children, className }) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  const control = children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">{prefix}</span>
          <div className="[&_input]:pl-7">{control}</div>
        </div>
      ) : (
        control
      )}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
