import { ArrowLeft, Calculator } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ForecastChart from '@/components/charts/ForecastChart'
import { AsyncSection, ErrorState, LoadingCard } from '@/components/financial/StateViews'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForecastAssumptions } from '@/features/forecast/ForecastSection'
import { ShortfallAlert } from '@/features/forecast/ShortfallAlert'
import { useCurrentProfile } from '@/features/profiles/useCurrentProfile'
import { useForecast } from '@/features/profiles/useProfileData'
import { buildScenario, dateBounds, emptyForm, formFromScenario } from '@/features/scenarios/scenarioRequest'
import { ScenarioForm } from '@/features/scenarios/ScenarioForm'
import { ScenarioResults } from '@/features/scenarios/ScenarioResults'
import { api } from '@/lib/api'
import { PageHeader } from './Dashboard'

export default function Simulator() {
  const { slug, overview } = useCurrentProfile()
  const location = useLocation()
  const forecast = useForecast(slug)
  const asOf = overview.asOf
  const [form, setForm] = useState(() => (location.state?.prefill ? formFromScenario(location.state.prefill) : emptyForm(asOf)))
  const [errors, setErrors] = useState({})
  const [run, setRun] = useState({ status: 'idle', scenario: null, result: null, error: null })
  const requestId = useRef(0)
  const resultsRef = useRef(null)
  const bounds = dateBounds(forecast.data)
  const floorCents = forecast.data?.assumptions?.cashFloorCents ?? 0

  const evaluate = async (formState = form) => {
    const { body, errors: errs } = buildScenario(formState, bounds)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const id = (requestId.current += 1)
    setRun((r) => ({ ...r, status: 'loading', error: null }))
    try {
      const result = await api.evaluateScenario(slug, body)
      if (id !== requestId.current) return
      setRun({ status: 'done', scenario: body, result, error: null })
      if (window.innerWidth < 1024) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      if (id !== requestId.current) return
      setRun((r) => ({ ...r, status: 'error', error }))
    }
  }

  // Arriving from a dashboard recommendation ("Try it"): evaluate once the forecast bounds are known.
  const autoRan = useRef(false)
  useEffect(() => {
    if (!autoRan.current && location.state?.prefill && forecast.data) {
      autoRan.current = true
      evaluate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecast.data])

  const tryAction = (action) => {
    const next = formFromScenario(action)
    setForm(next)
    evaluate(next)
  }

  return (
    <div className="space-y-6">
      <PageHeader overview={overview} title="Cash-flow simulator">
        <Link to={`/p/${slug}`} className={buttonClasses({ variant: 'ghost' })}>
          <ArrowLeft /> Dashboard
        </Link>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4 lg:sticky lg:top-32">
          {forecast.error ? (
            <ErrorState error={forecast.error} onRetry={forecast.reload} title="Could not load the baseline forecast" />
          ) : (
            <ScenarioForm
              form={form}
              setForm={setForm}
              errors={errors}
              bounds={bounds}
              asOf={asOf}
              onSubmit={() => evaluate()}
              submitting={run.status === 'loading' || (forecast.loading && !forecast.data)}
            />
          )}
        </div>

        <div ref={resultsRef} className="scroll-mt-32 space-y-4" aria-live="polite">
          {run.status === 'error' && <ErrorState error={run.error} title="Could not evaluate this scenario" onRetry={() => evaluate()} />}
          {run.status === 'loading' && !run.result && <LoadingCard chart />}
          {run.result ? (
            <div className={run.status === 'loading' ? 'pointer-events-none opacity-60 transition-opacity' : ''}>
              <ScenarioResults slug={slug} scenario={run.scenario} result={run.result} floorCents={floorCents} onTry={tryAction} />
            </div>
          ) : (
            run.status !== 'loading' && (
              <AsyncSection query={forecast} loading={<LoadingCard chart />}>
                {(f) => (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="size-4 text-muted-foreground" aria-hidden /> Your baseline
                      </CardTitle>
                      <CardDescription>
                        This is the forecast with no changes. Pick an example or describe a decision, then compare.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ShortfallAlert shortfalls={f.shortfalls} asOf={f.asOf} floorCents={floorCents} compact />
                      <ForecastChart daily={f.daily} checkpoints={f.checkpoints} floorCents={floorCents} />
                      <ForecastAssumptions assumptions={f.assumptions} />
                    </CardContent>
                  </Card>
                )}
              </AsyncSection>
            )
          )}
        </div>
      </div>
    </div>
  )
}
