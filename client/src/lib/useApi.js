import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getDataMode } from './api'

/**
 * GET-style data hook with a per-visit in-memory cache (keyed by `key`, e.g. "overview:early-career")
 * so switching pages during a demo is instant. Every profile-scoped key includes the slug, so results
 * are never shared across profiles. Entries are also scoped by data mode ('live' | 'mock'), so switching
 * between ?mock=1 and ?mock=0 never shows data cached from the other source. `reload()` refetches while
 * keeping the previous data visible.
 */
const cache = new Map()

export function useApi(baseKey, fetcher) {
  useLocation() // re-render when ?mock=1 / ?mock=0 changes the data mode
  const key = baseKey ? `${getDataMode().mode}|${baseKey}` : null
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState({ key: null, nonce: -1, data: null, error: null })
  const fetchNow = useEffectEvent((signal) => fetcher({ signal }))

  useEffect(() => {
    if (!key || cache.has(key)) return undefined
    const controller = new AbortController()
    let active = true
    fetchNow(controller.signal)
      .then((data) => {
        cache.set(key, data)
        if (active) setResult({ key, nonce, data, error: null })
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return
        setResult({ key, nonce, data: null, error })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key, nonce])

  const reload = useCallback(() => {
    if (key) cache.delete(key)
    setNonce((n) => n + 1)
  }, [key])

  const hit = key ? cache.get(key) : undefined
  const sameKey = result.key === key
  const error = !hit && sameKey && result.nonce === nonce ? result.error : null
  const data = hit ?? (sameKey ? result.data : null)
  const loading = Boolean(key) && !hit && !error
  return { data, error, loading, reload }
}
