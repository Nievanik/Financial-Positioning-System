import { cn } from '@/lib/utils'

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}
export const THead = ({ className, ...p }) => <thead className={cn('[&_tr]:border-b', className)} {...p} />
export const TBody = ({ className, ...p }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />
export const TR = ({ className, ...p }) => <tr className={cn('border-b transition-colors hover:bg-muted/50', className)} {...p} />
export const TH = ({ className, ...p }) => (
  <th className={cn('h-9 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap', className)} {...p} />
)
export const TD = ({ className, ...p }) => <td className={cn('px-3 py-2.5 align-middle', className)} {...p} />
