import { useCallback, useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react'
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

/* Data version: bumped after a profile edit so every cached response is dropped and every view refetches. */
let dataVersion = 0
const versionListeners = new Set()
const subscribeVersion = (fn) => {
  versionListeners.add(fn)
  return () => versionListeners.delete(fn)
}
const getVersion = () => dataVersion

/** Call after a successful write (profile edit): clears all cached responses and refetches mounted views. */
export function invalidateApiData() {
  cache.clear()
  dataVersion += 1
  versionListeners.forEach((fn) => fn())
}

/** Current data version; changes after invalidateApiData(). Use as part of a React `key` to remount views. */
export function useDataVersion() {
  return useSyncExternalStore(subscribeVersion, getVersion, getVersion)
}

export function useApi(baseKey, fetcher) {
  useLocation() // re-render when ?mock=1 / ?mock=0 changes the data mode
  const version = useDataVersion() // re-key after a profile edit
  const key = baseKey ? `${getDataMode().mode}|v${version}|${baseKey}` : null
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
