// Single fetch wrapper for the Express API. Errors follow { error: { code, message, details } }.
const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

// Offline UI work: VITE_USE_MOCKS=true serves src/mocks/ (exported by `npm run export:mocks` in server/).
const MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' ? import.meta.glob('../mocks/**/*.json', { import: 'default' }) : null
const MOCK_FILE = { 'scenarios/evaluate': 'scenario-one-time', explanations: 'explanation-forecast' }

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// shortcut: mocks ignore query params and request bodies (spending is always months=3, the scenario is always the
// exported "Laptop" one), fine for layout work; use the real API to check numbers.
async function mock(path) {
  const [, slug, ...rest] = path.split('?')[0].split('/').filter(Boolean)
  const name = rest.join('/')
  const load = MOCKS[slug ? `../mocks/${slug}/${MOCK_FILE[name] ?? name}.json` : '../mocks/profiles.json']
  if (!load) throw new ApiError(404, 'NOT_FOUND', `No mock for ${path}`)
  const data = await load()
  return name === 'scenarios/evaluate' ? data.response : data
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  if (MOCKS) return mock(path)
  let res
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.code || 'ERROR', e?.message || res.statusText, e?.details)
  }
  return data
}
