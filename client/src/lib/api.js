// Single fetch wrapper for the Express API. Errors follow { error: { code, message, details } }.
const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.code || 'ERROR', e?.message || res.statusText, e?.details)
  }
  return data
}
