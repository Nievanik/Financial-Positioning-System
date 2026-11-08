import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function App() {
  const [health, setHealth] = useState({ state: 'loading' })

  useEffect(() => {
    const ctrl = new AbortController()
    api('/health', { signal: ctrl.signal })
      .then((d) => setHealth({ state: 'ok', status: d.status }))
      .catch((e) => e.name !== 'AbortError' && setHealth({ state: 'error', message: e.message }))
    return () => ctrl.abort()
  }, [])

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Financial Positioning System</h1>
      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
        </CardHeader>
        <CardContent>
          {health.state === 'loading' && 'Checking…'}
          {health.state === 'ok' && `Server says: ${health.status}`}
          {health.state === 'error' && `Cannot reach API: ${health.message}`}
        </CardContent>
      </Card>
    </main>
  )
}
