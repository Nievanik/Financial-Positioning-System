import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const styles = {
  info: { box: 'border-[color-mix(in_oklch,var(--chart-2),transparent_60%)] bg-[color-mix(in_oklch,var(--chart-2),transparent_92%)]', icon: Info, color: 'text-[var(--chart-2)]' },
  success: { box: 'border-[color-mix(in_oklch,var(--success),transparent_60%)] bg-success-soft', icon: CheckCircle2, color: 'text-success' },
  warning: { box: 'border-[color-mix(in_oklch,var(--warning),transparent_40%)] bg-warning-soft', icon: AlertTriangle, color: 'text-[color-mix(in_oklch,var(--warning),black_30%)] dark:text-warning' },
  destructive: { box: 'border-[color-mix(in_oklch,var(--destructive),transparent_55%)] bg-destructive-soft', icon: XCircle, color: 'text-destructive' },
}

export function Alert({ variant = 'info', title, children, action, className, icon }) {
  const s = styles[variant]
  const Icon = icon || s.icon
  return (
    <div role={variant === 'destructive' || variant === 'warning' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-4', s.box, className)}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', s.color)} aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && <div className="mt-0.5 text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}
