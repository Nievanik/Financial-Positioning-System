/**
 * Single fetch wrapper for the Express API (docs/engineering.md section 5; docs/design.md section 9).
 *
 * Data mode (decided once per request, never per failure):
 * - LIVE when VITE_API_BASE_URL is set. A failed request surfaces as an ApiError and the UI shows it.
 *   Mock data is NEVER substituted after a failed live request.
 * - MOCK only when VITE_API_BASE_URL is unset, or when the URL contains ?mock=1. ?mock=1 keeps this
 *   browser tab in mock mode while navigating; ?mock=0 returns to live. The header badge shows the mode.
 *
 * Responses are passed through lib/apiAdapters.js, which only renames/reshapes server fields for the
 * components; it never changes a financial value.
 */
import { mockRequest } from '@/mocks'
import { adaptHealthMetrics, adaptOverview } from './apiAdapters'
import { ApiError } from './apiError'

export { ApiError }

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const API_PREFIX = '/api/v1'
const MOCK_KEY = 'fps-mock-mode'

function mockFlag() {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search).get('mock')
  try {
    if (q === '1') sessionStorage.setItem(MOCK_KEY, '1')
    if (q === '0') sessionStorage.removeItem(MOCK_KEY)
    return q === '1' || (q !== '0' && sessionStorage.getItem(MOCK_KEY) === '1')
  } catch {
    return q === '1'
  }
}

/** True when the app is explicitly in mock mode (no API configured, or ?mock=1). */
export function isMockMode() {
  return !BASE_URL || mockFlag()
}

/** 'live' | 'mock' — for the header badge. `reason` explains why mock mode is on. */
export function getDataMode() {
  if (!BASE_URL) return { mode: 'mock', reason: 'VITE_API_BASE_URL is not set' }
  if (mockFlag()) return { mode: 'mock', reason: '?mock=1 was requested' }
  return { mode: 'live', reason: BASE_URL }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  if (isMockMode()) return mockRequest(path, method, body)

  let res
  try {
    res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(0, 'NETWORK_ERROR', `Cannot reach the FPS server (${BASE_URL}). Check that it is running, or open the app with ?mock=1 for demo data.`)
  }

  if (res.status === 204) return null // e.g. DELETE /flows/:id
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const json = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const e = json?.error || {}
    throw new ApiError(res.status, e.code || 'HTTP_ERROR', e.message || `Request failed (HTTP ${res.status}).`, e.details)
  }
  if (!isJson || json === null) throw new ApiError(res.status, 'BAD_RESPONSE', 'The server returned an unreadable response.')
  return json
}

function qs(params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

const p = (slug) => `/profiles/${encodeURIComponent(slug)}`
const e = encodeURIComponent

/** Profile editing writes to the shared database, so it is live-only; mock fixtures are read-only. */
function write(path, method, body) {
  if (isMockMode()) {
    return Promise.reject(new ApiError(0, 'MOCK_READ_ONLY', 'Editing needs the live API. Mock data is read-only (remove ?mock=1 or set VITE_API_BASE_URL).'))
  }
  return request(path, { method, body })
}

export const api = {
  health: (opts) => request('/health', opts),
  getProfiles: (opts) => request('/profiles', opts),
  getOverview: (slug, opts) => request(`${p(slug)}/overview`, opts).then(adaptOverview),
  getTransactions: (slug, params, opts) => request(`${p(slug)}/transactions${qs(params)}`, opts),
  getSpending: (slug, months = 3, opts) => request(`${p(slug)}/spending${qs({ months })}`, opts),
  getHealthMetrics: (slug, opts) => request(`${p(slug)}/health-metrics`, opts).then(adaptHealthMetrics),
  getForecast: (slug, opts) => request(`${p(slug)}/forecast`, opts),
  getRecommendations: (slug, opts) => request(`${p(slug)}/recommendations`, opts),
  evaluateScenario: (slug, scenario, opts) =>
    request(`${p(slug)}/scenarios/evaluate`, { ...opts, method: 'POST', body: scenario }),
  explain: (slug, payload, opts) => request(`${p(slug)}/explanations`, { ...opts, method: 'POST', body: payload }),

  // Profile editing (engineering.md section 5.4). Live API only; see write().
  getEditable: (slug, opts) => request(`${p(slug)}/editable`, opts),
  updateAccount: (slug, id, body) => write(`${p(slug)}/accounts/${e(id)}`, 'PUT', body),
  createFlow: (slug, body) => write(`${p(slug)}/flows`, 'POST', body),
  updateFlow: (slug, id, body) => write(`${p(slug)}/flows/${e(id)}`, 'PUT', body),
  deleteFlow: (slug, id) => write(`${p(slug)}/flows/${e(id)}`, 'DELETE'),
  createLoan: (slug, body) => write(`${p(slug)}/loans`, 'POST', body),
  updateLoan: (slug, id, body) => write(`${p(slug)}/loans/${e(id)}`, 'PUT', body),
  deleteLoan: (slug, id) => write(`${p(slug)}/loans/${e(id)}`, 'DELETE'),
  saveSpendingEstimates: (slug, categoryOverridesCents) => write(`${p(slug)}/spending-estimates`, 'PUT', { categoryOverridesCents }),

  // Investment Planner (engineering.md section 10). Plans/decisions live in server memory and reset on restart.
  getInvestmentAssumptions: (opts) => request('/investments/assumptions', opts),
  getInvestmentPortfolio: (slug, opts) => request(`${p(slug)}/investments/portfolio`, opts),
  getInvestmentCds: (slug, opts) => request(`${p(slug)}/investments/cds`, opts),
  simulateAllocation: (slug, input, opts) =>
    request(`${p(slug)}/investments/allocations/simulate`, { ...opts, method: 'POST', body: input }),
  listInvestmentPlans: (slug, opts) => request(`${p(slug)}/investments/plans`, opts),
  saveInvestmentPlan: (slug, plan, opts) => request(`${p(slug)}/investments/plans`, { ...opts, method: 'POST', body: plan }),
  decideInvestmentPlan: (slug, planId, decision, opts) =>
    request(`${p(slug)}/investments/plans/${encodeURIComponent(planId)}/decision`, { ...opts, method: 'POST', body: { decision } }),
  removeInvestmentPlan: (slug, planId, opts) =>
    request(`${p(slug)}/investments/plans/${encodeURIComponent(planId)}`, { ...opts, method: 'DELETE' }),
  decideCd: (slug, accountId, payload, opts) =>
    request(`${p(slug)}/investments/cds/${encodeURIComponent(accountId)}/decision`, { ...opts, method: 'POST', body: payload }),
  clearCdDecision: (slug, accountId, opts) =>
    request(`${p(slug)}/investments/cds/${encodeURIComponent(accountId)}/decision`, { ...opts, method: 'DELETE' }),
}

/** Human-readable message for any thrown error. */
export function errorMessage(err) {
  if (!err) return ''
  if (err instanceof ApiError) {
    if (err.code === 'PROFILE_NOT_FOUND') return 'We could not find that demo profile.'
    if (err.status === 429) return 'Too many requests — please wait a moment and try again.'
    if (err.code === 'DB_UNAVAILABLE') return 'The FPS server cannot reach its database right now. Try again shortly.'
    return err.message
  }
  return err.message || 'Something went wrong.'
}
