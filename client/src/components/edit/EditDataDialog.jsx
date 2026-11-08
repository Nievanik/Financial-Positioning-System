import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { addDays, fromInput, titleCase, toInput } from '@/lib/format'
import { ErrorNote, Skeleton } from '@/components/layout/Panel'

const KINDS = { income: 'Income', bill: 'Bill (rent, utilities…)', credit_card_payment: 'Card payment', savings_contribution: 'To savings', retirement_contribution: 'To retirement' }
const LOAN_TYPES = ['auto', 'mortgage', 'student', 'personal', 'other']
const input = 'w-full min-w-0 rounded-md border border-line bg-white px-2 py-1.5 text-[12px]'

function L({ label, children, className }) {
  return (
    <label className={className}>
      <span className="mb-0.5 block text-[10px] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

// One editable record: local form state, Save (POST when new, PUT otherwise) and Delete.
// toBody returns the API body or a string error; money fields stay as text until save.
function Row({ initial, toBody, path, canDelete = true, onSaved, onCancelNew, children }) {
  const [form, setForm] = useState(initial)
  const [state, setState] = useState({})
  const isNew = !initial.id
  const dirty = isNew || JSON.stringify(form) !== JSON.stringify(initial)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function run(method, body) {
    setState({ busy: true })
    try {
      await api(isNew ? path : `${path}/${initial.id}`, { method, body })
      setState({})
      onSaved()
    } catch (e) {
      setState({ error: e.message })
    }
  }
  function save(e) {
    e.preventDefault()
    const body = toBody(form)
    if (typeof body === 'string') setState({ error: body })
    else run(isNew ? 'POST' : 'PUT', body)
  }

  return (
    <form onSubmit={save} className="rounded-[10px] border border-line p-2.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children(form, set)}</div>
      <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
        {state.error && <span role="alert" className="mr-auto text-red">{state.error}</span>}
        {isNew ? (
          <button type="button" onClick={onCancelNew} className="px-2 py-1 text-muted-foreground hover:underline">Cancel</button>
        ) : canDelete && (
          <button type="button" disabled={state.busy} onClick={() => confirm(`Delete "${initial.name}"?`) && run('DELETE')} className="px-2 py-1 text-red hover:underline">Delete</button>
        )}
        <button disabled={state.busy || !dirty} className="rounded-md bg-teal px-3 py-1 font-bold text-white disabled:opacity-40">
          {state.busy ? 'Saving…' : isNew ? 'Add' : 'Save'}
        </button>
      </div>
    </form>
  )
}

// Money text -> cents, or throws the message Row shows.
const need = (value, label, { min = 0 } = {}) => {
  const c = fromInput(value)
  if (Number.isNaN(c) || c < min) throw new Error(`${label}: enter an amount${min ? ' above 0' : ''}`)
  return c
}
const guard = (fn) => (form) => {
  try {
    return fn(form)
  } catch (e) {
    return e.message
  }
}

function Section({ title, sub, onAdd, children }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-bold">{title}</h3>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        {onAdd && <button onClick={onAdd} className="text-[11px] font-bold text-teal hover:underline">+ Add</button>}
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function Body({ base, data, onSaved }) {
  const [draft, setDraft] = useState({}) // section -> unsaved new row
  const done = () => { setDraft({}); onSaved() }
  const firstDate = addDays(data.asOf, 1)
  const [spend, setSpend] = useState(() => Object.fromEntries(data.spendCategories.map((c) => [c, toInput(data.categoryOverridesCents[c])])))
  const [spendState, setSpendState] = useState({})

  async function saveSpend(e) {
    e.preventDefault()
    const entries = Object.entries(spend).filter(([, v]) => v.trim() !== '').map(([c, v]) => [c, fromInput(v)])
    if (entries.some(([, v]) => Number.isNaN(v))) return setSpendState({ error: 'Enter amounts like 250 or 250.50, or leave blank.' })
    setSpendState({ busy: true })
    try {
      await api(`${base}/spending-estimates`, { method: 'PUT', body: { categoryOverridesCents: Object.fromEntries(entries) } })
      setSpendState({ saved: true })
      onSaved()
    } catch (err) {
      setSpendState({ error: err.message })
    }
  }

  const flows = [...data.flows.map((f) => ({ ...f, amount: toInput(f.amountCents), endDate: f.endDate ?? '' })), ...(draft.flow ? [draft.flow] : [])]
  const loans = [...data.loans.map((l) => ({ ...l, outstanding: toInput(l.outstandingCents), payment: toInput(l.monthlyPaymentCents), rate: toInput(l.annualRateBps), dueDay: String(l.dueDay) })), ...(draft.loan ? [draft.loan] : [])]

  return (
    <>
      <Section title="Balances" sub="Checking and savings are your available cash. For cards, enter what you owe.">
        {data.accounts.map((a) => (
          <Row
            key={a.id}
            initial={{ id: a.id, name: a.name, balance: toInput(a.balanceCents), limit: toInput(a.creditLimitCents) }}
            path={`${base}/accounts`}
            canDelete={false}
            onSaved={done}
            toBody={guard((f) => ({
              name: f.name,
              balanceCents: need(f.balance, a.type === 'credit_card' ? 'Owed' : 'Balance'),
              ...(a.type === 'credit_card' && { creditLimitCents: f.limit.trim() ? need(f.limit, 'Credit limit') : null }),
            }))}
          >
            {(f, set) => (
              <>
                <L label={`Name · ${titleCase(a.type)}`}><input required className={input} value={f.name} onChange={set('name')} /></L>
                <L label={a.type === 'credit_card' ? 'Owed ($)' : 'Balance ($)'}><input inputMode="decimal" className={input} value={f.balance} onChange={set('balance')} /></L>
                {a.type === 'credit_card' && <L label="Credit limit ($)"><input inputMode="decimal" className={input} value={f.limit} onChange={set('limit')} /></L>}
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section
        title="Income & bills"
        sub="Paychecks, rent, utilities, subscriptions and other repeating money in or out."
        onAdd={!draft.flow && (() => setDraft((d) => ({ ...d, flow: { name: '', kind: 'bill', amount: '', frequency: 'monthly', nextDate: firstDate, endDate: '', category: 'housing' } })))}
      >
        {flows.map((fl) => (
          <Row
            key={fl.id ?? 'new'}
            initial={fl}
            path={`${base}/flows`}
            onSaved={done}
            onCancelNew={() => setDraft((d) => ({ ...d, flow: null }))}
            toBody={guard((f) => ({
              name: f.name, kind: f.kind, amountCents: need(f.amount, 'Amount', { min: 1 }), frequency: f.frequency,
              nextDate: f.nextDate, endDate: f.endDate || null, category: f.kind === 'income' ? 'income' : f.category,
            }))}
          >
            {(f, set) => (
              <>
                <L label="Name"><input required maxLength={60} className={input} value={f.name} onChange={set('name')} /></L>
                <L label="Type">
                  <select className={input} value={f.kind} onChange={set('kind')}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </L>
                <L label={f.kind === 'income' ? 'Take-home ($)' : 'Amount ($)'}><input inputMode="decimal" className={input} value={f.amount} onChange={set('amount')} /></L>
                <L label="How often">
                  <select className={input} value={f.frequency} onChange={set('frequency')}>{['weekly', 'biweekly', 'monthly'].map((k) => <option key={k} value={k}>{titleCase(k)}</option>)}</select>
                </L>
                <L label="Next date"><input type="date" required min={firstDate} className={input} value={f.nextDate} onChange={set('nextDate')} /></L>
                {f.kind !== 'income' ? (
                  <L label="Category">
                    <select className={input} value={f.category} onChange={set('category')}>{data.categories.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</select>
                  </L>
                ) : <L label="Ends (optional)"><input type="date" min={f.nextDate} className={input} value={f.endDate} onChange={set('endDate')} /></L>}
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section
        title="Debts"
        sub="Loans and their monthly payment. The payment is added to your forecast automatically."
        onAdd={!draft.loan && (() => setDraft((d) => ({ ...d, loan: { name: '', loanType: 'personal', outstanding: '', payment: '', dueDay: '1', rate: '' } })))}
      >
        {loans.map((ln) => (
          <Row
            key={ln.id ?? 'new'}
            initial={ln}
            path={`${base}/loans`}
            onSaved={done}
            onCancelNew={() => setDraft((d) => ({ ...d, loan: null }))}
            toBody={guard((f) => ({
              name: f.name, loanType: f.loanType, outstandingCents: need(f.outstanding, 'Balance'), monthlyPaymentCents: need(f.payment, 'Monthly payment', { min: 1 }),
              dueDay: Number(f.dueDay), annualRateBps: f.rate.trim() ? need(f.rate, 'Rate') : null,
            }))}
          >
            {(f, set) => (
              <>
                <L label="Name"><input required maxLength={60} className={input} value={f.name} onChange={set('name')} /></L>
                <L label="Type">
                  <select className={input} value={f.loanType} onChange={set('loanType')}>{LOAN_TYPES.map((k) => <option key={k} value={k}>{titleCase(k)}</option>)}</select>
                </L>
                <L label="Balance left ($)"><input inputMode="decimal" className={input} value={f.outstanding} onChange={set('outstanding')} /></L>
                <L label="Monthly payment ($)"><input inputMode="decimal" className={input} value={f.payment} onChange={set('payment')} /></L>
                <L label="Due day (1-28)"><input type="number" min={1} max={28} required className={input} value={f.dueDay} onChange={set('dueDay')} /></L>
                <L label="Interest rate (%)"><input inputMode="decimal" className={input} value={f.rate} onChange={set('rate')} /></L>
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section title="Monthly spending" sub="Everyday spending per month (groceries, eating out…). Leave blank to estimate it from recent transactions.">
        <form onSubmit={saveSpend} className="rounded-[10px] border border-line p-2.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.spendCategories.map((c) => (
              <L key={c} label={`${titleCase(c)} ($/mo)`}>
                <input inputMode="decimal" placeholder="Estimated" className={input} value={spend[c]} onChange={(e) => { setSpendState({}); setSpend((s) => ({ ...s, [c]: e.target.value })) }} />
              </L>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
            {spendState.error && <span role="alert" className="mr-auto text-red">{spendState.error}</span>}
            {spendState.saved && <span className="mr-auto text-teal">Saved</span>}
            <button disabled={spendState.busy} className="rounded-md bg-teal px-3 py-1 font-bold text-white disabled:opacity-40">{spendState.busy ? 'Saving…' : 'Save spending'}</button>
          </div>
        </form>
      </Section>
    </>
  )
}

// Modal editor for the selected profile; onChanged tells the dashboard to refetch.
export function EditDataDialog({ profile, open, onClose, onChanged }) {
  const ref = useRef(null)
  const base = profile && `/profiles/${profile.slug}`
  // Not useApi: after a save the old lists stay on screen while reloading, so scroll and open drafts survive.
  const [editable, setEditable] = useState({})
  const load = useCallback(() => {
    api(`${base}/editable`).then((data) => setEditable({ base, data })).catch((error) => setEditable({ base, error }))
  }, [base])

  useEffect(() => {
    const d = ref.current
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    if (open && base) load()
  }, [open, base, load])

  const current = editable.base === base ? editable : {}
  const saved = () => { load(); onChanged() }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="edit-data-title"
      className="m-auto max-h-[90vh] w-[min(760px,calc(100vw-32px))] rounded-[13px] border border-line bg-paper p-0 text-ink shadow-card backdrop:bg-[#0d1b2a]/50"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:px-5">
        <div>
          <h2 id="edit-data-title" className="text-[15px] font-bold">Edit {profile?.displayName ?? 'profile'}’s data</h2>
          <p className="text-[11px] text-muted-foreground">Changes save to this shared demo profile and update every chart.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-md hover:bg-track"><X className="size-4" /></button>
      </div>
      <div className="px-4 py-4 md:px-5">
        {current.error ? <ErrorNote error={current.error} onRetry={load} />
          : current.data ? <Body key={base} base={base} data={current.data} onSaved={saved} />
            : open && <div className="grid gap-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}
      </div>
    </dialog>
  )
}
