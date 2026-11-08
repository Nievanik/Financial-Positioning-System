import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { SourceBadge } from '@/components/financial/SourceBadge'
import { ErrorState } from '@/components/financial/StateViews'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api, errorMessage } from '@/lib/api'
import { addDays } from '@/lib/dates'
import { ACCOUNT_TYPE_LABELS, CATEGORY_LABELS, FREQUENCY_LABELS, label, LOAN_TYPE_LABELS } from '@/lib/labels'
import { centsToInput, dollarsToCents } from '@/lib/money'

/**
 * Profile editor (docs/engineering.md section 5.4), ported from the dev single-page UI into this app's
 * design system. Writes go to the live API only; the caller disables it in mock mode. After every save the
 * editable lists reload and `onChanged` invalidates cached responses so all pages refetch.
 */

const FLOW_KINDS = {
  income: 'Income (take-home)',
  bill: 'Bill (rent, utilities…)',
  credit_card_payment: 'Card payment',
  savings_contribution: 'To savings',
  retirement_contribution: 'To retirement',
}
const FREQUENCIES = ['weekly', 'biweekly', 'monthly']
const LOAN_TYPES = ['auto', 'mortgage', 'student', 'personal', 'other']

/** Dollar text -> cents; throws the message the row shows. `allowBlank` returns null for an empty field. */
function cents(value, field, { min = 0, allowBlank = false } = {}) {
  if (allowBlank && String(value ?? '').trim() === '') return null
  const c = dollarsToCents(value)
  if (c === null || c < min) throw new Error(`${field}: enter an amount like 250 or 250.50${min ? ' (more than $0)' : ''}.`)
  return c
}
/** Percent text ("5.2") -> basis points (520). Same 2-decimal parse as dollars -> cents. */
const bps = (value) => cents(value, 'Interest rate', { allowBlank: true })

function Field({ label: text, className, children }) {
  const id = useId()
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {text}
      </Label>
      {children(id)}
    </div>
  )
}

/** One editable record: local form state, Save (POST when new, PUT otherwise) and optional Delete. */
function Row({ initial, toBody, onSave, onDelete, onCancelNew, onSaved, children }) {
  const [form, setForm] = useState(initial)
  const [state, setState] = useState({})
  const isNew = !initial.id
  const dirty = isNew || JSON.stringify(form) !== JSON.stringify(initial)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function run(fn) {
    setState({ busy: true })
    try {
      await fn()
      setState({})
      onSaved()
    } catch (err) {
      setState({ error: errorMessage(err) })
    }
  }
  function save(e) {
    e.preventDefault()
    let body
    try {
      body = toBody(form)
    } catch (err) {
      setState({ error: err.message })
      return
    }
    run(() => onSave(body, isNew ? null : initial.id))
  }

  return (
    <form onSubmit={save} className="rounded-lg border bg-card p-3" noValidate>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children(form, set)}</div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {state.error && (
          <p role="alert" className="mr-auto text-xs text-destructive">
            {state.error}
          </p>
        )}
        {isNew ? (
          <Button size="sm" variant="ghost" onClick={onCancelNew}>
            Cancel
          </Button>
        ) : (
          onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={state.busy}
              onClick={() => window.confirm(`Delete “${initial.name}”?`) && run(() => onDelete(initial.id))}
            >
              <Trash2 /> Delete
            </Button>
          )
        )}
        <Button size="sm" type="submit" disabled={state.busy || !dirty}>
          {state.busy && <Loader2 className="animate-spin" />}
          {isNew ? 'Add' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function Section({ title, sub, onAdd, addLabel, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {onAdd && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus /> {addLabel}
          </Button>
        )}
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function Body({ slug, data, onSaved }) {
  const [draft, setDraft] = useState({}) // section -> unsaved new row
  const done = () => {
    setDraft({})
    onSaved()
  }
  const firstDate = addDays(data.asOf, 1)
  const [spend, setSpend] = useState(() =>
    Object.fromEntries(data.spendCategories.map((c) => [c, centsToInput(data.categoryOverridesCents?.[c])])),
  )
  const [spendState, setSpendState] = useState({})

  async function saveSpend(e) {
    e.preventDefault()
    let entries
    try {
      entries = Object.entries(spend)
        .filter(([, v]) => String(v).trim() !== '')
        .map(([c, v]) => [c, cents(v, label(CATEGORY_LABELS, c))])
    } catch (err) {
      setSpendState({ error: err.message })
      return
    }
    setSpendState({ busy: true })
    try {
      await api.saveSpendingEstimates(slug, Object.fromEntries(entries))
      setSpendState({ saved: true })
      onSaved()
    } catch (err) {
      setSpendState({ error: errorMessage(err) })
    }
  }

  const flows = [
    ...data.flows.map((f) => ({ ...f, id: String(f.id), amount: centsToInput(f.amountCents), endDate: f.endDate ?? '' })),
    ...(draft.flow ? [draft.flow] : []),
  ]
  const loans = [
    ...data.loans.map((l) => ({
      ...l,
      id: String(l.id),
      outstanding: centsToInput(l.outstandingCents),
      payment: centsToInput(l.monthlyPaymentCents),
      rate: centsToInput(l.annualRateBps),
      dueDay: String(l.dueDay),
    })),
    ...(draft.loan ? [draft.loan] : []),
  ]

  return (
    <div className="space-y-6">
      <Section title="Balances" sub="Checking and savings are available cash. For cards, enter what you owe. CDs and investments stay long-term holdings.">
        {data.accounts.map((a) => (
          <Row
            key={String(a.id)}
            initial={{ id: String(a.id), name: a.name, balance: centsToInput(a.balanceCents), limit: centsToInput(a.creditLimitCents) }}
            onSave={(body, id) => api.updateAccount(slug, id, body)}
            onSaved={done}
            toBody={(f) => ({
              name: f.name.trim(),
              balanceCents: cents(f.balance, a.type === 'credit_card' ? 'Owed' : 'Balance'),
              ...(a.type === 'credit_card' && { creditLimitCents: cents(f.limit, 'Credit limit', { allowBlank: true }) }),
            })}
          >
            {(f, set) => (
              <>
                <Field label={`Name · ${label(ACCOUNT_TYPE_LABELS, a.type)}`}>
                  {(id) => <Input id={id} required maxLength={60} value={f.name} onChange={set('name')} />}
                </Field>
                <Field label={a.type === 'credit_card' ? 'Owed ($)' : 'Balance ($)'}>
                  {(id) => <Input id={id} inputMode="decimal" value={f.balance} onChange={set('balance')} />}
                </Field>
                {a.type === 'credit_card' ? (
                  <Field label="Credit limit ($)">{(id) => <Input id={id} inputMode="decimal" value={f.limit} onChange={set('limit')} />}</Field>
                ) : (
                  <div className="flex items-end pb-2">
                    <SourceBadge source={a.source} />
                  </div>
                )}
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section
        title="Income & bills"
        sub="Paychecks, rent, utilities, subscriptions and other repeating money in or out. Loan payments are edited under Debts."
        addLabel="Add"
        onAdd={
          !draft.flow &&
          (() =>
            setDraft((d) => ({
              ...d,
              flow: { name: '', kind: 'bill', amount: '', frequency: 'monthly', nextDate: firstDate, endDate: '', category: 'housing' },
            })))
        }
      >
        {flows.map((fl) => (
          <Row
            key={fl.id ?? 'new-flow'}
            initial={fl}
            onSave={(body, id) => (id ? api.updateFlow(slug, id, body) : api.createFlow(slug, body))}
            onDelete={(id) => api.deleteFlow(slug, id)}
            onCancelNew={() => setDraft((d) => ({ ...d, flow: null }))}
            onSaved={done}
            toBody={(f) => ({
              name: f.name.trim(),
              kind: f.kind,
              amountCents: cents(f.amount, 'Amount', { min: 1 }),
              frequency: f.frequency,
              nextDate: f.nextDate,
              endDate: f.endDate || null,
              category: f.kind === 'income' ? 'income' : f.category,
            })}
          >
            {(f, set) => (
              <>
                <Field label="Name">{(id) => <Input id={id} required maxLength={60} value={f.name} onChange={set('name')} />}</Field>
                <Field label="Type">
                  {(id) => (
                    <Select id={id} value={f.kind} onChange={set('kind')}>
                      {Object.entries(FLOW_KINDS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label={f.kind === 'income' ? 'Take-home ($)' : 'Amount ($)'}>
                  {(id) => <Input id={id} inputMode="decimal" value={f.amount} onChange={set('amount')} />}
                </Field>
                <Field label="How often">
                  {(id) => (
                    <Select id={id} value={f.frequency} onChange={set('frequency')}>
                      {FREQUENCIES.map((k) => (
                        <option key={k} value={k}>{label(FREQUENCY_LABELS, k)}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Next date">{(id) => <Input id={id} type="date" required min={firstDate} value={f.nextDate} onChange={set('nextDate')} />}</Field>
                {f.kind !== 'income' ? (
                  <Field label="Category">
                    {(id) => (
                      <Select id={id} value={f.category} onChange={set('category')}>
                        {data.categories.map((c) => (
                          <option key={c} value={c}>{label(CATEGORY_LABELS, c)}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                ) : (
                  <Field label="Ends (optional)">{(id) => <Input id={id} type="date" min={f.nextDate} value={f.endDate} onChange={set('endDate')} />}</Field>
                )}
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section
        title="Debts"
        sub="Loans and their monthly payment. The payment is added to the forecast once, automatically."
        addLabel="Add loan"
        onAdd={
          !draft.loan &&
          (() => setDraft((d) => ({ ...d, loan: { name: '', loanType: 'personal', outstanding: '', payment: '', dueDay: '1', rate: '' } })))
        }
      >
        {loans.map((ln) => (
          <Row
            key={ln.id ?? 'new-loan'}
            initial={ln}
            onSave={(body, id) => (id ? api.updateLoan(slug, id, body) : api.createLoan(slug, body))}
            onDelete={(id) => api.deleteLoan(slug, id)}
            onCancelNew={() => setDraft((d) => ({ ...d, loan: null }))}
            onSaved={done}
            toBody={(f) => {
              const dueDay = Number(f.dueDay)
              if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) throw new Error('Due day must be a whole number from 1 to 28.')
              return {
                name: f.name.trim(),
                loanType: f.loanType,
                outstandingCents: cents(f.outstanding, 'Balance left'),
                monthlyPaymentCents: cents(f.payment, 'Monthly payment', { min: 1 }),
                dueDay,
                annualRateBps: bps(f.rate),
              }
            }}
          >
            {(f, set) => (
              <>
                <Field label="Name">{(id) => <Input id={id} required maxLength={60} value={f.name} onChange={set('name')} />}</Field>
                <Field label="Type">
                  {(id) => (
                    <Select id={id} value={f.loanType} onChange={set('loanType')}>
                      {LOAN_TYPES.map((k) => (
                        <option key={k} value={k}>{label(LOAN_TYPE_LABELS, k)}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Balance left ($)">{(id) => <Input id={id} inputMode="decimal" value={f.outstanding} onChange={set('outstanding')} />}</Field>
                <Field label="Monthly payment ($)">{(id) => <Input id={id} inputMode="decimal" value={f.payment} onChange={set('payment')} />}</Field>
                <Field label="Due day (1–28)">{(id) => <Input id={id} type="number" min={1} max={28} required value={f.dueDay} onChange={set('dueDay')} />}</Field>
                <Field label="Interest rate (%)">{(id) => <Input id={id} inputMode="decimal" value={f.rate} onChange={set('rate')} />}</Field>
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section title="Monthly spending" sub="Everyday spending per month. Leave blank to estimate it from recent transactions.">
        <form onSubmit={saveSpend} className="rounded-lg border bg-card p-3" noValidate>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.spendCategories.map((c) => (
              <Field key={c} label={`${label(CATEGORY_LABELS, c)} ($/mo)`}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    placeholder="Estimated"
                    value={spend[c]}
                    onChange={(e) => {
                      setSpendState({})
                      setSpend((s) => ({ ...s, [c]: e.target.value }))
                    }}
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            {spendState.error && <p role="alert" className="mr-auto text-xs text-destructive">{spendState.error}</p>}
            {spendState.saved && <p role="status" className="mr-auto text-xs text-success">Saved</p>}
            <Button size="sm" type="submit" disabled={spendState.busy}>
              {spendState.busy && <Loader2 className="animate-spin" />} Save spending
            </Button>
          </div>
        </form>
      </Section>
    </div>
  )
}

/** Modal editor for the selected profile; `onChanged` invalidates cached data so every page refetches. */
export function EditDataDialog({ slug, displayName, open, onClose, onChanged }) {
  const ref = useRef(null)
  const [editable, setEditable] = useState({})
  const load = useCallback(() => {
    api
      .getEditable(slug)
      .then((data) => setEditable({ slug, data }))
      .catch((error) => setEditable({ slug, error }))
  }, [slug])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    if (open && slug) load()
  }, [open, slug, load])

  const current = editable.slug === slug ? editable : {}
  const saved = () => {
    load()
    onChanged()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="edit-data-title"
      className="m-auto max-h-[90vh] w-[min(820px,calc(100vw-32px))] overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-background px-5 py-4">
        <div>
          <h2 id="edit-data-title" className="flex items-center gap-2 text-base font-semibold">
            <Pencil className="size-4 text-muted-foreground" aria-hidden /> Edit {displayName || 'profile'}’s data
          </h2>
          <p className="text-xs text-muted-foreground">
            Changes save to this shared demo profile (synthetic data) and update every page. Transactions stay read-only.
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close editor">
          <X />
        </Button>
      </div>
      <div className="px-5 py-5">
        {current.error ? (
          <ErrorState error={current.error} onRetry={load} title="Could not load editable data" />
        ) : current.data ? (
          <Body key={slug} slug={slug} data={current.data} onSaved={saved} />
        ) : (
          open && (
            <div className="grid gap-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          )
        )}
      </div>
    </dialog>
  )
}
