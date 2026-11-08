import { Banknote, CalendarRange, Loader2, Play, Scissors, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { formatDay } from '@/lib/dates'
import { CATEGORY_LABELS, label } from '@/lib/labels'
import { presets, REDUCTION_CATEGORIES, SCENARIO_TYPES } from './scenarioRequest'

const TYPE_ICONS = { one_time: <ShoppingBag />, down_payment_recurring: <CalendarRange />, monthly_spending_reduction: <Scissors /> }

export function ScenarioForm({ form, setForm, errors = {}, bounds, asOf, onSubmit, submitting }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const money = (key, lbl, hint) => (
    <Field label={lbl} hint={hint} error={errors[key]} prefix="$">
      {(a) => <Input {...a} inputMode="decimal" autoComplete="off" value={form[key] ?? ''} onChange={set(key)} placeholder="0" />}
    </Field>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe a decision</CardTitle>
        <CardDescription>Nothing is saved — the server re-runs your forecast with this change and compares it to the baseline.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          noValidate
        >
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick examples</p>
            <div className="flex flex-wrap gap-1.5">
              {presets(asOf).map((p) => (
                <Button key={p.id} size="sm" variant="outline" onClick={() => setForm({ ...form, ...p.form })}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <Segmented
            label="Scenario type"
            value={form.type}
            onChange={(type) => setForm((f) => ({ ...f, type }))}
            options={SCENARIO_TYPES.map((t) => ({ ...t, icon: TYPE_ICONS[t.value] }))}
            size="sm"
            className="w-full"
          />

          <Field label="Name">
            {(a) => <Input {...a} value={form.name ?? ''} onChange={set('name')} maxLength={60} placeholder="e.g. Laptop" />}
          </Field>

          {form.type === 'one_time' && money('amount', 'Purchase amount')}
          {form.type === 'down_payment_recurring' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {money('downPayment', 'Down payment', 'Paid on the start date')}
              {money('monthlyAmount', 'Monthly payment', 'Starts one month after')}
            </div>
          )}
          {form.type === 'monthly_spending_reduction' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {money('monthlyAmount', 'Cut per month', 'Spread evenly across each week')}
              <Field label="Category">
                {(a) => (
                  <Select {...a} value={form.category} onChange={set('category')}>
                    {REDUCTION_CATEGORIES.map((c) => <option key={c} value={c}>{label(CATEGORY_LABELS, c)}</option>)}
                  </Select>
                )}
              </Field>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Start date"
              error={errors.startDate}
              hint={bounds.minDate ? `${formatDay(bounds.minDate, 'short')} – ${formatDay(bounds.maxDate, 'short')}` : undefined}
            >
              {(a) => <Input {...a} type="date" value={form.startDate} min={bounds.minDate} max={bounds.maxDate} onChange={set('startDate')} />}
            </Field>
            {form.type !== 'one_time' && (
              <Field label="Months to include" error={errors.durationMonths} hint="Within the 6-month forecast only">
                {(a) => (
                  <Select {...a} value={form.durationMonths} onChange={set('durationMonths')}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} month{n > 1 ? 's' : ''}</option>)}
                  </Select>
                )}
              </Field>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Play />}
            {submitting ? 'Comparing…' : 'Compare with baseline'}
          </Button>
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <Banknote className="size-3.5 shrink-0" aria-hidden />
            Recurring amounts are injected only within the six-month demo forecast — not a full loan term, and not a loan approval.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
