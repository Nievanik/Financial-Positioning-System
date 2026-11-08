import { Bot, FileText, MessageSquareText, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { ErrorState } from './StateViews'

/**
 * Plain-English explanation from POST /explanations. The server explains engine-computed facts
 * (AI if configured, deterministic template otherwise); the UI never generates numbers.
 * `payload` is `{ subject: 'forecast' }` or `{ subject: 'scenario', scenario }`; changing it clears the text.
 */
export function ExplanationPanel({ slug, payload, label = 'Explain in plain English' }) {
  const forKey = `${slug}:${JSON.stringify(payload)}`
  const [raw, setState] = useState({ forKey, status: 'idle', result: null, error: null })
  // A new subject (different scenario/profile) resets to idle without an effect.
  const state = raw.forKey === forKey ? raw : { status: 'idle', result: null, error: null }

  const run = async () => {
    setState({ forKey, status: 'loading', result: null, error: null })
    try {
      const result = await api.explain(slug, payload)
      setState((s) => (s.forKey === forKey ? { forKey, status: 'done', result, error: null } : s))
    } catch (error) {
      setState((s) => (s.forKey === forKey ? { forKey, status: 'error', result: null, error } : s))
    }
  }

  if (state.status === 'idle') {
    return (
      <Button variant="secondary" onClick={run}>
        <MessageSquareText /> {label}
      </Button>
    )
  }
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={run} title="Explanation unavailable" />
  return (
    <div className="rounded-lg border bg-muted/40 p-4" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-2">
        {state.status === 'loading' ? (
          <p className="text-sm text-muted-foreground">Writing explanation…</p>
        ) : state.result?.method === 'ai' ? (
          <Badge variant="primary"><Bot /> AI explanation of computed figures</Badge>
        ) : (
          <Badge variant="outline"><FileText /> Template explanation</Badge>
        )}
        {state.status === 'done' && (
          <Button size="sm" variant="ghost" onClick={run} aria-label="Regenerate explanation">
            <RefreshCw />
          </Button>
        )}
      </div>
      {state.status === 'loading' ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{state.result?.text}</p>
      )}
    </div>
  )
}
