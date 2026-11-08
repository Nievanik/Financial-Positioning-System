import { useId, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, money, prettyDates } from '@/lib/format'
import { startMonths, toRequest, TYPES } from '@/lib/scenario'
import { cn } from '@/lib/utils'

const CHECKPOINTS = [1, 2, 3, 6]
const SLIDERS = {
  amount: { label: 'Purchase amount', min: 250, max: 10000, step: 250 },
  downPayment: { label: 'Down payment', min: 250, max: 10000, step: 250 },
  monthly: { label: 'Monthly payment', min: 25, max: 1500, step: 25 },
  cut: { label: 'Spend less per month', min: 25, max: 1000, step: 25 },
}
const FIELDS = { one_time: ['amount'], down_payment_recurring: ['downPayment', 'monthly'], monthly_spending_reduction: ['cut'] }

const selectCls = 'w-full rounded-lg border border-[#3a5370] bg-[#233d5d] px-3 py-[9px] text-white [&>option]:text-ink'

function Field({ label, value, htmlFor, children }) {
  return (
    <div className="my-[15px]">
      <div className="mb-[7px] flex justify-between gap-2 text-[11px] text-[#d3dce6]">
        <label htmlFor={htmlFor}>{label}</label>
        {value && <strong className="text-[12px] text-white">{value}</strong>}
      </div>
      {children}
    </div>
  )
}

// Backend only returns suggestions that help month 6 and/or the lowest balance; mention only what improves.
const impactText = (rec) => {
  const parts = [
    rec.impactMonth6Cents > 0 && `adds ${money(rec.impactMonth6Cents)} by month 6`,
    rec.impactMinimumCashCents > 0 && `lifts your lowest balance by ${money(rec.impactMinimumCashCents)}`,
  ].filter(Boolean)
  return parts.join(' and ').replace(/^./, (c) => c.toUpperCase())
}

function errorText(e) {
  if (e.status === 429) return 'Too many requests. Try again in a minute.'
  if (e.status === 422) return `That scenario isn't valid: ${e.message}.`
  return e.message
}

// asOf from overview; baseline = GET /recommendations; result/onResult lifted so the forecast chart can overlay it.
export function WhatIfPanel({ slug, asOf, baseline, result, onResult }) {
  const id = useId()
  const months = asOf ? startMonths(asOf) : []
  const [form, setForm] = useState({ type: 'one_time', amount: 2000, downPayment: 2000, monthly: 300, cut: 100, duration: 6, startDate: '' })
  const [checkpoint, setCheckpoint] = useState(6)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [why, setWhy] = useState({})

  const startDate = form.startDate || months[0]
  const request = toRequest({ ...form, monthly: form.type === 'monthly_spending_reduction' ? form.cut : form.monthly, startDate })
  const stale = result && JSON.stringify(result.request) !== JSON.stringify(request)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'range' || k === 'duration' ? Number(e.target.value) : e.target.value }))

  async function evaluate() {
    setBusy(true)
    setError(null)
    setWhy({})
    try {
      onResult({ request, response: await api(`/profiles/${slug}/scenarios/evaluate`, { method: 'POST', body: request }) })
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  async function explain() {
    setWhy({ loading: true })
    try {
      setWhy({ text: (await api(`/profiles/${slug}/explanations`, { method: 'POST', body: { subject: 'scenario', scenario: result.request } })).text })
    } catch (e) {
      setWhy({ text: errorText(e) })
    }
  }

  const r = result?.response
  const point = r?.scenario.checkpoints.find((c) => c.month === checkpoint)
  const delta = r?.deltas[`month${checkpoint}Cents`]
  const rec = r ? r.recommendations[0] : baseline.data?.recommendations[0]

  return (
    <section
      id="scenario"
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 rounded-[13px] border border-navy bg-navy p-4 text-white shadow-card md:col-span-2 md:p-[19px] lg:col-span-1"
    >
      <div className="md:grid md:grid-cols-2 md:gap-5 lg:block">
        <div>
          <h2 id={`${id}-title`} className="mb-[3px] text-[15px] font-bold tracking-[-0.2px]">Try a what-if</h2>
          <p className="text-[11px] text-[#b8c6d6]">See how a decision could affect your cash</p>

          <Field label="Decision type" htmlFor={`${id}-type`}>
            <select id={`${id}-type`} value={form.type} onChange={set('type')} className={selectCls}>
              {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          </Field>

          {FIELDS[form.type].map((k) => {
            const { label, ...range } = SLIDERS[k]
            return (
              <Field key={k} label={label} value={money(form[k] * 100)} htmlFor={`${id}-${k}`}>
                <input id={`${id}-${k}`} type="range" {...range} value={form[k]} onChange={set(k)} className="w-full accent-[#4ac0a8]" />
              </Field>
            )
          })}

          <div className={cn('grid gap-2.5', form.type !== 'one_time' && 'grid-cols-2')}>
            <Field label="Starting" htmlFor={`${id}-start`}>
              <select id={`${id}-start`} value={startDate ?? ''} onChange={set('startDate')} className={selectCls}>
                {months.map((d) => <option key={d} value={d}>{formatDate(d, { month: 'short', year: 'numeric' })}</option>)}
              </select>
            </Field>
            {form.type !== 'one_time' && (
              <Field label="For" htmlFor={`${id}-duration`}>
                <select id={`${id}-duration`} value={form.duration} onChange={set('duration')} className={selectCls}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} month{n > 1 ? 's' : ''}</option>)}
                </select>
              </Field>
            )}
          </div>
        </div>

        <div>
          <div className="mt-3 rounded-[10px] border border-[#37516d] bg-[#203a59] p-3" aria-live="polite">
            {r ? (
              <>
                <div role="group" aria-label="Checkpoint" className="mb-1.5 flex gap-1">
                  {CHECKPOINTS.map((m) => (
                    <button
                      key={m}
                      aria-pressed={checkpoint === m}
                      onClick={() => setCheckpoint(m)}
                      className={cn('rounded-md px-2 py-0.5 text-[10px] text-[#bdcbd9]', checkpoint === m && 'bg-[#36b39d] font-bold text-[#102e39]')}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-[#bdcbd9]">Estimated cash on {formatDate(point.date)}</span>
                <strong className={cn('my-0.5 block text-[20px]', point.cashCents < 0 && 'text-[#ff9a9a]')}>{money(point.cashCents)}</strong>
                <small className="text-[10px] text-[#cbd6e2]">
                  {delta === 0 ? 'Same as your current forecast' : `${money(Math.abs(delta))} ${delta < 0 ? 'less' : 'more'} than your current forecast`}
                </small>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#cbd6e2]">
                  <span className={cn('rounded-[20px] px-[7px] py-[3px] font-bold', r.assessment.riskLevel === 'ok' ? 'bg-[#e8f5f0] text-[#23816f]' : 'bg-red-pale text-red')}>
                    {r.assessment.riskLevel === 'ok' ? 'Stays above your floor' : `Cash runs short ${formatDate(r.assessment.firstShortfallDate, { month: 'short', day: 'numeric' })}`}
                  </span>
                  {r.assessment.reasons[0] && <span>{r.assessment.reasons[0]}.</span>}
                  {!r.assessment.reasons[0] && r.assessment.riskLevel !== 'ok' && r.baseline.shortfalls.length > 0 && <span>Your current forecast already runs short on {formatDate(r.baseline.shortfalls[0].date, { month: 'short', day: 'numeric' })}.</span>}
                </div>
                {stale && <p className="mt-2 text-[10px] text-[#f2c879]">Inputs changed. Compare again to update.</p>}
              </>
            ) : (
              <span className="text-[10px] text-[#bdcbd9]">Pick a decision and compare it with your forecast.</span>
            )}
          </div>

          {error && <p role="alert" className="mt-2 text-[11px] text-[#ff9a9a]">{error}</p>}
          <button
            onClick={evaluate}
            disabled={busy || !slug || !startDate}
            className="mt-3 w-full rounded-lg bg-[#36b39d] p-2.5 text-[11px] font-[750] text-[#102e39] disabled:opacity-60"
          >
            {busy ? 'Calculating…' : r && !stale ? 'Compare again' : 'Compare with forecast →'}
          </button>
          {r && (
            <div className="mt-2 flex justify-between text-[10px]">
              <a href="#forecast" className="text-[#b8c6d6] underline-offset-2 hover:underline">See it on the chart ↑</a>
              <button onClick={() => onResult(null)} className="text-[#b8c6d6] hover:underline">Clear</button>
            </div>
          )}

          <div className="mt-[11px] rounded-[11px] border border-[#f2e8d6] bg-[#fffaf1] p-3.5 text-[#5e533f]">
            <div className="text-[10px] font-[750] tracking-[0.7px] text-[#a67430] uppercase">A thought to consider</div>
            {rec ? (
              <>
                <p className="mt-1.5 text-[11px] font-bold">{rec.title}</p>
                <p className="mt-0.5 text-[11px]">
                  {prettyDates(rec.action)}. {impactText(rec)}.
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[11px]">
                {r ? 'This fits your forecast. No change needed.' : baseline.loading ? 'Loading…' : 'No suggestion right now.'}
              </p>
            )}
            {r && !stale && (
              why.text ? <p className="mt-2 border-t border-[#f2e8d6] pt-2 text-[11px]">{prettyDates(why.text)}</p> : (
                <button onClick={explain} disabled={why.loading} className="mt-2 text-[11px] font-bold text-[#a67430] hover:underline">
                  {why.loading ? 'Explaining…' : 'Explain this result'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
