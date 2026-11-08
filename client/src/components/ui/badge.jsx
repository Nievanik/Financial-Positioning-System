import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  outline: 'border text-muted-foreground',
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-[color-mix(in_oklch,var(--warning),black_35%)] dark:text-warning',
  destructive: 'bg-destructive-soft text-destructive',
  synthetic: 'border border-dashed border-[color-mix(in_oklch,var(--chart-4),transparent_40%)] text-[var(--chart-4)]',
}

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap [&_svg]:size-3',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
