import { Loader2, Save, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisStyle } from '@/components/charts/chartUtils'
import { IllustrativeBadge } from '@/components/financial/SourceBadge'
import { ErrorState } from '@/components/financial/StateViews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { api, errorMessage } from '@/lib/api'
import { dollarsToCents, formatAxisCents, formatBps, formatCents } from '@/lib/money'
import { allocationTotal, rebalance } from './allocationSliders'
import { ASSET_CLASS_COLORS, RISK_BADGE, SCENARIO_COLORS } from './assumptions'

function ProjectionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">Year {label} (hypothetical)</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex justify-between gap-4 tabular-nums">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{formatCents(p.value, { whole: true })}</span>
        </p>
      ))}
    </div>
  )
}

function AllocationSliders({ assetClasses, allocation, onChange }) {
  const ids = assetClasses.map((a) => a.id)
  return (
    <div className="space-y-4">
      {assetClasses.map((a) => (
        <div key={a.id} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor={`alloc-${a.id}`} className="flex items-center gap-2 font-medium">
              <span className="size-2.5 rounded-full" style={{ background: ASSET_CLASS_COLORS[a.id] }} aria-hidden /> {a.label}
            </label>
            <span className="w-12 text-right font-semibold tabular-nums">{allocation[a.id]}%</span>
          </div>
          <input
            id={`alloc-${a.id}`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={allocation[a.id]}
            onChange={(e) => onChange(rebalance(allocation, ids, a.id, e.target.value))}
            className="fps-range w-full"
            style={{ accentColor: ASSET_CLASS_COLORS[a.id] }}
            aria-valuetext={`${allocation[a.id]} percent`}
          />
        </div>
      ))}
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {assetClasses.map((a) => (
          <div key={a.id} style={{ width: `${allocation[a.id]}%`, background: ASSET_CLASS_COLORS[a.id] }} className="transition-[width]" />
        ))}
      </div>
    </div>
  )
}

/**
 * Sliders are local UI state; every number shown (returns, projection, risk, stress) comes from
 * POST /investments/allocations/simulate. Saving calls POST /investments/plans.
 */
export function AllocationPlanner({ slug, assumptions, suggestedAmountCents, onSaved }) {
  const { assetClasses, presets } = assumptions
  const ids = assetClasses.map((a) => a.id)
  const [allocation, setAllocation] = useState(() => (presets.find((p) => p.id === 'balanced') || presets[0]).allocation)
  const [amount, setAmount] = useState('10000')
  const [years, setYears] = useState(10)
  const [planName, setPlanName] = useState('')
  const [sim, setSim] = useState({ status: 'idle', data: null, error: null })
  const [save, setSave] = useState({ status: 'idle', message: '', error: null })
  const amountCents = dollarsToCents(amount)
  const valid = amountCents !== null && amountCents > 0
  const presetId = presets.find((p) => ids.every((id) => p.allocation[id] === allocation[id]))?.id || 'custom'
  const inputKey = JSON.stringify({ allocation, amountCents, years })

  // Debounced server simulation whenever the inputs change.
  useEffect(() => {
    if (!valid) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSim((s) => ({ ...s, status: 'loading' }))
      api
        .simulateAllocation(slug, { allocation, amountCents, years }, { signal: controller.signal })
        .then((data) => setSim({ status: 'done', data, error: null }))
        .catch((error) => {
          if (error?.name !== 'AbortError') setSim({ status: 'error', data: null, error })
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey, slug])

  const savePlan = async () => {
    if (!valid) return
    setSave({ status: 'saving', message: '', error: null })
    try {
      const res = await api.saveInvestmentPlan(slug, { name: planName.trim() || undefined, allocation, amountCents, years })
      setPlanName('')
      setSave({ status: 'done', message: `Saved “${res.plan.name}” as a proposal — review it below.`, error: null })
      onSaved?.()
    } catch (error) {
      setSave({ status: 'error', message: '', error })
    }
  }

  const d = sim.data
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            label="Allocation preset"
            size="sm"
            value={presetId}
            onChange={(id) => {
              const p = presets.find((x) => x.id === id)
              if (p) setAllocation(p.allocation)
            }}
            options={[...presets.map((p) => ({ value: p.id, label: p.label })), ...(presetId === 'custom' ? [{ value: 'custom', label: 'Custom' }] : [])]}
          />
          <Badge variant={allocationTotal(allocation, ids) === 100 ? 'success' : 'destructive'}>Total {allocationTotal(allocation, ids)}%</Badge>
        </div>
        <AllocationSliders assetClasses={assetClasses} allocation={allocation} onChange={setAllocation} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Hypothetical amount"
            prefix="$"
            error={valid ? undefined : 'Enter an amount above $0.'}
            hint={
              typeof suggestedAmountCents === 'number' && suggestedAmountCents > 0 ? (
                <button type="button" className="cursor-pointer text-primary hover:underline" onClick={() => setAmount(String(Math.round(suggestedAmountCents / 100)))}>
                  Use my long-term balance ({formatCents(suggestedAmountCents, { whole: true })})
                </button>
              ) : undefined
            }
          >
            {(a) => <Input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Time horizon</span>
            <Segmented label="Time horizon" size="sm" value={years} onChange={setYears} options={[1, 5, 10, 20].map((y) => ({ value: y, label: `${y} yr` }))} />
          </div>
        </div>
      </div>

      <div className="space-y-4" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <IllustrativeBadge>Hypothetical returns</IllustrativeBadge>
          {d && (
            <Badge variant={RISK_BADGE[d.risk.band] || 'outline'}>
              {d.risk.label} risk · ~{formatBps(d.risk.volatilityBps).replace('.00', '')} yearly swing
            </Badge>
          )}
          {sim.status === 'loading' && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Recalculating" />}
        </div>
        {sim.status === 'error' && <ErrorState error={sim.error} title="Could not simulate this allocation" />}
        {d && (
          <div className={sim.status === 'loading' ? 'space-y-4 opacity-60 transition-opacity' : 'space-y-4'}>
            <div className="grid grid-cols-3 gap-2">
              {d.scenarios.map((s) => (
                <div key={s.id} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{formatBps(s.annualReturnBps)}/yr</p>
                  <p className="mt-1 font-semibold tabular-nums" style={{ color: SCENARIO_COLORS[s.id] }}>
                    {formatCents(s.finalValueCents, { compact: true })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">after {d.input.years} yr</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={d.projection} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(y) => `Y${y}`} />
                <YAxis tickFormatter={formatAxisCents} tick={axisStyle} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<ProjectionTooltip />} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                {d.scenarios.map((s) => (
                  <Line key={s.id} dataKey={s.id} name={s.label} stroke={SCENARIO_COLORS[s.id]} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="flex gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              <ShieldAlert className="size-4 shrink-0 text-[var(--chart-3)]" aria-hidden />
              In a hypothetical bad year ({formatBps(d.stress.shockBps)} for this mix), it could drop about{' '}
              <span className="font-semibold text-foreground">{formatCents(d.stress.lossCents, { whole: true })}</span>. Money you need within a year or two
              usually belongs in cash, not here.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Plan name" className="flex-1">
            {(a) => <Input {...a} value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Balanced 10-year" maxLength={60} />}
          </Field>
          <Button onClick={savePlan} disabled={!valid || save.status === 'saving'}>
            {save.status === 'saving' ? <Loader2 className="animate-spin" /> : <Save />} Save as proposed plan
          </Button>
        </div>
        {save.status === 'done' && <p className="text-xs text-success" role="status">{save.message}</p>}
        {save.status === 'error' && <p className="text-xs text-destructive" role="alert">{errorMessage(save.error)}</p>}
      </div>
    </div>
  )
}
