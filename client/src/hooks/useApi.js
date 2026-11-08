import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

// GET `path` (null = skip), or POST `body` when given (read-only calculation routes). Aborts on change/unmount.
// Data is tied to the request key, so a profile switch shows loading instead of the previous profile's numbers.
export function useApi(path, body) {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({})
  const json = body === undefined ? '' : JSON.stringify(body)
  const key = path && `${path}#${json}#${tick}`

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    api(path, json ? { method: 'POST', body: JSON.parse(json), signal: ctrl.signal } : { signal: ctrl.signal })
      .then((data) => setState({ key, data }))
      .catch((error) => !ctrl.signal.aborted && setState({ key, error }))
    return () => ctrl.abort()
  }, [key, path, json])

  // A null path means "waiting on something else" (e.g. the profile list), which counts as loading.
  const fresh = Boolean(key) && state.key === key
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
    retry: () => setTick((t) => t + 1),
  }
}

// One loading/error state for a widget that needs several requests.
export const combine = (...results) => ({
  loading: results.some((r) => r.loading),
  error: results.find((r) => r.error)?.error,
  retry: () => results.forEach((r) => r.error && r.retry()),
})
