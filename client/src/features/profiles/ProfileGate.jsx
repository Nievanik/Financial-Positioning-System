import { Outlet, useLocation, useParams } from 'react-router-dom'
import { ErrorState, LoadingCard } from '@/components/financial/StateViews'
import { ApiError, getDataMode } from '@/lib/api'
import { useDataVersion } from '@/lib/useApi'
import ProfileNotFound from './ProfileNotFound'
import { useOverview } from './useProfileData'

/**
 * Resolves `:slug` once via /overview and shares the result with child pages through outlet context.
 * Keyed by slug, data mode and data version so per-page state (e.g. a what-if result) resets on a profile
 * switch, a mock/live switch, or after a profile edit changes the underlying numbers.
 */
export default function ProfileGate() {
  const { slug } = useParams()
  const overview = useOverview(slug)
  useLocation()
  const mode = getDataMode().mode
  const version = useDataVersion()

  if (overview.loading && !overview.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <LoadingCard key={i} lines={2} />)}
        <LoadingCard chart className="sm:col-span-2 lg:col-span-4" />
      </div>
    )
  }
  if (overview.error instanceof ApiError && overview.error.status === 404) return <ProfileNotFound slug={slug} />
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} title="Could not load this profile" />
  if (!overview.data) return null

  return (
    <div key={`${slug}:${mode}:${version}`}>
      <Outlet context={{ slug, overview: overview.data, reloadOverview: overview.reload }} />
    </div>
  )
}
