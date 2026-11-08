import { Check, ClipboardList, Loader2, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/financial/StateViews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api, errorMessage } from '@/lib/api'
import { formatBps, formatCents } from '@/lib/money'
import { ASSET_CLASS_COLORS } from './assumptions'

const STATUS = {
  pending: { variant: 'warning', label: 'Awaiting your review' },
  approved: { variant: 'success', label: 'Approved (simulated)' },
  rejected: { variant: 'outline', label: 'Rejected' },
}

/** Proposed plans from GET /investments/plans (server memory). Approval records a decision; nothing executes. */
export function ProposedPlans({ slug, plans, assetClasses, onChanged }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const act = async (id, fn) => {
    setBusy(id)
    setError(null)
    try {
      await fn()
      onChanged?.()
    } catch (e) {
      setError(e)
      onChanged?.()
    } finally {
      setBusy(null)
    }
  }

  if (!plans.length) {
    return <EmptyState icon={ClipboardList} title="No proposed plans yet">Adjust the sliders above and save an allocation to review it here.</EmptyState>
  }
  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive" role="alert">{errorMessage(error)}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => {
          const st = STATUS[p.status] || STATUS.pending
          return (
            <li key={p.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(p.amountCents, { whole: true })} hypothetical · {p.years} yr · {p.risk?.label} risk
                  </p>
                </div>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden>
                {assetClasses.map((a) => <div key={a.id} style={{ width: `${p.allocation[a.id]}%`, background: ASSET_CLASS_COLORS[a.id] }} />)}
              </div>
              <p className="text-xs text-muted-foreground">{assetClasses.map((a) => `${a.label} ${p.allocation[a.id]}%`).join(' · ')}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {p.scenarios.map((o) => (
                  <div key={o.id} className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">{o.label}</p>
                    <p className="font-semibold tabular-nums">{formatCents(o.finalValueCents, { compact: true })}</p>
                    <p className="text-muted-foreground tabular-nums">{formatBps(o.annualReturnBps)}/yr</p>
                  </div>
                ))}
              </div>
              {p.status === 'pending' ? (
                <div className="space-y-2 rounded-md border border-dashed p-3">
                  <p className="text-xs text-muted-foreground">
                    Review required. Approving records your decision for this demo only — FPS will not place trades or move money.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" disabled={busy === p.id} onClick={() => act(p.id, () => api.decideInvestmentPlan(slug, p.id, 'approved'))}>
                      {busy === p.id ? <Loader2 className="animate-spin" /> : <Check />} Approve proposal
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => act(p.id, () => api.decideInvestmentPlan(slug, p.id, 'rejected'))}>
                      <X /> Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {p.status === 'approved'
                    ? 'Approved as a plan to discuss with a licensed advisor or your bank. No trade was placed (executed: false).'
                    : 'Rejected — nothing will happen.'}
                </p>
              )}
              <Button size="sm" variant="ghost" className="self-end text-muted-foreground" disabled={busy === p.id} onClick={() => act(p.id, () => api.removeInvestmentPlan(slug, p.id))}>
                <Trash2 /> Remove
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
