import { BellRing, Check, Loader2, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { IllustrativeBadge } from '@/components/financial/SourceBadge'
import { EmptyState } from '@/components/financial/StateViews'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { api, errorMessage } from '@/lib/api'
import { daysBetween, formatDay } from '@/lib/dates'
import { formatBps, formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

const STATUS_BADGE = { due_soon: ['warning', 'Due soon'], upcoming: ['outline', 'Upcoming'], matured: ['destructive', 'Matured'] }

function Timeline({ cds, asOf }) {
  const last = cds.reduce((m, c) => (c.maturityDate > m ? c.maturityDate : m), asOf)
  const span = Math.max(30, daysBetween(asOf, last) + 20) // layout only
  return (
    <div className="px-2 pb-2 pt-10" aria-hidden>
      <div className="relative h-1.5 rounded-full bg-muted">
        <div className="absolute -top-1.5 left-0 size-4 -translate-x-1/2 rounded-full border-2 border-card bg-foreground" />
        <span className="absolute left-0 top-4 -translate-x-1/4 text-[10px] text-muted-foreground">Today · {formatDay(asOf, 'short')}</span>
        {cds.map((c, i) => (
          <div key={c.accountId} className="absolute -top-1.5" style={{ left: `${(Math.max(0, c.daysToMaturity) / span) * 100}%` }}>
            <div className="size-4 -translate-x-1/2 rounded-full border-2 border-card bg-[var(--chart-3)]" />
            <span className={cn('absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-medium', i % 2 ? 'top-5' : '-top-6')}>
              {c.name.split(' (')[0]} · {formatDay(c.maturityDate, 'short')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Reminder({ slug, cd, onChanged }) {
  const [action, setAction] = useState(cd.options[0]?.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const decision = cd.decision
  const chosen = cd.options.find((o) => o.id === (decision?.action || action))
  const [variant, statusLabel] = STATUS_BADGE[cd.status] || STATUS_BADGE.upcoming

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
      onChanged?.()
    }
  }

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-medium">
            <BellRing className="size-4 text-[var(--chart-3)]" aria-hidden /> {cd.name} matures {formatDay(cd.maturityDate, 'long')}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCents(cd.principalCents)} principal{cd.annualRateBps ? ` at ${formatBps(cd.annualRateBps)} APY` : ''} ·{' '}
            {cd.daysToMaturity >= 0 ? `${cd.daysToMaturity} days away` : 'already matured'} · simulated reminder {formatDay(cd.reminderDate, 'short')}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Badge variant={variant}>{statusLabel}</Badge>
          {decision ? (
            <Badge variant={decision.decision === 'approved' ? 'success' : 'outline'}>
              {decision.decision === 'approved' ? 'Approved (simulated)' : 'Rejected'}
            </Badge>
          ) : (
            <Badge variant="warning">Needs your decision</Badge>
          )}
        </div>
      </div>

      {decision ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 p-3 text-sm">
          <p>
            {decision.decision === 'approved' ? (
              <>You approved: <span className="font-medium">{chosen?.label}</span>. Recorded for the demo only — no transfer or renewal was made.</>
            ) : (
              <>You rejected “{chosen?.label}”. Nothing will happen to this CD.</>
            )}
          </p>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => api.clearCdDecision(slug, cd.accountId))}>
            <RotateCcw /> Change
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor={`cd-action-${cd.accountId}`} className="text-xs font-medium text-muted-foreground">Proposed action</label>
            <Select id={`cd-action-${cd.accountId}`} value={action} onChange={(e) => setAction(e.target.value)} className="mt-1">
              {cd.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </div>
          {chosen && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {chosen.hypotheticalRateBps ? <IllustrativeBadge>Hypothetical rate {formatBps(chosen.hypotheticalRateBps)}</IllustrativeBadge> : null}
              {chosen.description}
              {chosen.estimatedInterestCents ? ` About ${formatCents(chosen.estimatedInterestCents, { whole: true })} of interest.` : ''}
              {chosen.addsToAvailableCashCents ? ` Would add ${formatCents(chosen.addsToAvailableCashCents, { whole: true })} to spendable cash on ${formatDay(chosen.effectiveDate, 'short')}.` : ''}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="success" disabled={busy} onClick={() => run(() => api.decideCd(slug, cd.accountId, { action, decision: 'approved' }))}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />} Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.decideCd(slug, cd.accountId, { action, decision: 'rejected' }))}>
              <X /> Reject
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive" role="alert">{errorMessage(error)}</p>}
    </li>
  )
}

/** CD timeline + reminders from GET /investments/cds. Each proposed action needs explicit approval or rejection. */
export function CdTimeline({ slug, data, onChanged }) {
  const cds = data?.cds || []
  const undated = data?.undatedCds || []
  if (!cds.length && !undated.length) return <EmptyState title="No CDs on file">This profile has no certificates of deposit.</EmptyState>
  return (
    <div className="space-y-4">
      {cds.length > 0 && <Timeline cds={cds} asOf={data.asOf} />}
      <Alert variant="info" title="Simulated reminders">
        FPS shows these reminders on this page only. It does not send notifications and never renews, withdraws or transfers anything automatically.
        {data.storage?.note ? ` ${data.storage.note}` : ''}
      </Alert>
      <ul className="grid gap-3 md:grid-cols-2">
        {cds.map((cd) => <Reminder key={cd.accountId} slug={slug} cd={cd} onChanged={onChanged} />)}
      </ul>
      {undated.length > 0 && <p className="text-xs text-muted-foreground">Maturity date not provided for: {undated.map((c) => c.name).join(', ')}.</p>}
    </div>
  )
}
