import { Inbox, RefreshCw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export function LoadingCard({ className, lines = 3, chart = false }) {
  return (
    <Card className={className} aria-busy="true">
      <span className="sr-only">Loading…</span>
      <CardHeader>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {chart ? <Skeleton className="h-56 w-full" /> : Array.from({ length: lines }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </CardContent>
    </Card>
  )
}

export function ErrorState({ error, onRetry, title = 'Could not load this section', className }) {
  return (
    <Alert
      variant="destructive"
      title={title}
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw /> Retry
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Alert>
  )
}

export function EmptyState({ title, children, icon: Icon = Inbox, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center', className)}>
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {children && <p className="max-w-sm text-xs text-muted-foreground">{children}</p>}
    </div>
  )
}

/** Render loading / error / content for a useApi() result. */
export function AsyncSection({ query, loading, children }) {
  if (query.loading && !query.data) return loading ?? <LoadingCard />
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
  if (!query.data) return null
  return children(query.data)
}
