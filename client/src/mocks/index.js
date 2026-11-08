/**
 * MOCK API — used ONLY in explicit mock mode (VITE_API_BASE_URL unset, or ?mock=1; see lib/api.js).
 * Same routes, shapes and errors as the FPS server (docs/engineering.md sections 5 and 10).
 *
 * Data sources (all labeled synthetic):
 * - `<slug>/*.json`, `profiles.json`: real API responses exported by `npm run export:mocks` (origin/dev).
 * - `investment-holdings.json`: supplemental CD/brokerage accounts + server-computed totals that include them.
 * - `engine-inputs.json` + `engine/*`: server engine copy so what-if results and recommendations equal the live API.
 * - `investments.js` + `investmentEngine.js`: Investment Planner routes (in-tab memory for plans).
 */
import { ApiError } from '@/lib/apiError'
import { formatCents } from '@/lib/money'
import engineInputs from './engine-inputs.json'
import { baselineRecommendations, evaluateScenario } from './engine/scenarios.js'
import holdingsFixture from './investment-holdings.json'
import { assumptionsPayload, investmentMockRoute } from './investments'
import profilesFixture from './profiles.json'

const LATENCY_MS = 250
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' })
const fixture = (slug, name) => files[`./${slug}/${name}.json`]
const SLUGS = profilesFixture.profiles.map((p) => p.slug)

/** Overview with the supplemental holdings merged in (no-op once the export already contains them). */
function overview(slug) {
  const base = fixture(slug, 'overview')
  const supp = holdingsFixture.profiles[slug]
  if (!supp || base.accounts.some((a) => a.type === 'cd' || a.type === 'investment')) return base
  return { ...base, accounts: [...base.accounts, ...supp.accounts], totals: supp.totals }
}

function holdings(slug) {
  const o = overview(slug)
  return { slug, displayName: o.profile.displayName, asOf: o.asOf, accounts: o.accounts.map((a) => ({ ...a, id: String(a.id) })) }
}

function transactions(slug, params) {
  const limit = Math.min(Math.max(Number(params.get('limit')) || 50, 1), 100)
  const category = params.get('category')
  const from = params.get('from')
  const to = params.get('to')
  // Same accountId rules as the server (engineering.md 5.1): malformed -> 400, not this profile's -> 404.
  // The fixture holds each profile's full history (< 100 rows), so the filter is complete, not newest-100.
  const accountId = params.has('accountId') ? params.get('accountId').toLowerCase() : null
  if (accountId !== null) {
    if (!/^[0-9a-f]{24}$/.test(accountId)) throw new ApiError(400, 'VALIDATION_FAILED', 'accountId must be a 24-character account id')
    if (!overview(slug).accounts.some((a) => String(a.id) === accountId)) throw new ApiError(404, 'ACCOUNT_NOT_FOUND', 'That account does not belong to this demo profile')
  }
  const items = fixture(slug, 'transactions').items.filter(
    (t) =>
      (!category || t.category === category) &&
      (!accountId || String(t.accountId) === accountId) &&
      (!from || t.occurredAt.slice(0, 10) >= from) &&
      (!to || t.occurredAt.slice(0, 10) <= to),
  )
  return { items: items.slice(0, limit) }
}

function evaluate(slug, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'VALIDATION_FAILED', 'Body must be a scenario object')
  try {
    return evaluateScenario(engineInputs.profiles[slug], body)
  } catch (err) {
    if (err?.status) throw new ApiError(err.status, err.code, err.message)
    throw err
  }
}

function explanation(slug, body) {
  if (body?.subject === 'forecast') return fixture(slug, 'explanation-forecast')
  if (body?.subject !== 'scenario') throw new ApiError(400, 'VALIDATION_FAILED', 'subject must be "forecast" or "scenario"')
  const r = evaluate(slug, body.scenario)
  const first = r.assessment.firstShortfallDate
  return {
    method: 'template',
    text:
      `Mock mode: adding "${body.scenario?.name || body.scenario?.type}" changes the projected ${r.scenario.checkpoints[3].date} balance by ` +
      `${formatCents(r.deltas.month6Cents, { whole: true, signed: true })}. ` +
      (first ? `Cash would first fall below the floor on ${first}. ` : 'Cash stays above the floor on every day of the forecast. ') +
      'This is an estimate from synthetic demo data, not financial advice or a loan decision.',
  }
}

export async function mockRequest(path, method = 'GET', body) {
  await delay(LATENCY_MS)
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] === 'health') return { status: 'ok', mock: true }
  if (parts[0] === 'investments' && parts[1] === 'assumptions' && method === 'GET') return assumptionsPayload()
  if (parts[0] !== 'profiles') throw new ApiError(404, 'NOT_FOUND', 'Route not found')
  if (parts.length === 1 && method === 'GET') return profilesFixture

  const slug = decodeURIComponent(parts[1] || '')
  if (!SLUGS.includes(slug)) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'Unknown demo profile')
  const route = parts.slice(2).join('/')

  if (parts[2] === 'investments') {
    const res = investmentMockRoute(holdings(slug), route, method, body)
    if (res !== undefined) return res
  }
  if (method === 'GET') {
    if (route === 'overview') return overview(slug)
    if (route === 'transactions') return transactions(slug, params)
    if (route === 'spending') return fixture(slug, 'spending')
    if (route === 'health-metrics') return fixture(slug, 'health-metrics')
    if (route === 'forecast') return fixture(slug, 'forecast')
    // Same engine as the server (fixture predates the structured `scenario` field).
    if (route === 'recommendations') return { recommendations: baselineRecommendations(engineInputs.profiles[slug]) }
  }
  if (method === 'POST') {
    if (route === 'scenarios/evaluate') return evaluate(slug, body)
    if (route === 'explanations') return explanation(slug, body)
  }
  throw new ApiError(404, 'NOT_FOUND', 'Route not found')
}
