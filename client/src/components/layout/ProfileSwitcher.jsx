import { UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useProfiles } from '@/features/profiles/useProfileData'
import { Select } from '@/components/ui/input'
import { switchProfilePath } from '@/lib/navigation'

/**
 * Demo customer selector (docs/design.md section 3). Not a login: it only changes which fictional
 * customer's synthetic data is shown. Keeps the current section; an account page lands on Accounts.
 */
export function ProfileSwitcher() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { data, loading, error } = useProfiles()
  const profiles = data?.profiles || []

  const onChange = (e) => navigate(switchProfilePath(pathname, slug, e.target.value, search))

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="profile-switcher" className="hidden text-xs font-medium text-muted-foreground sm:inline">
        Demo customer
      </label>
      <div className="relative flex items-center">
        <UserRound className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden />
        <Select
          id="profile-switcher"
          aria-label="Demo customer (fictional, no login)"
          value={slug || ''}
          onChange={onChange}
          disabled={loading || !!error}
          className="h-9 w-36 pl-8 text-sm font-medium sm:w-auto sm:min-w-44"
        >
          {!slug && <option value="" disabled>{loading ? 'Loading customers…' : 'Choose a demo customer'}</option>}
          {profiles.map((p) => (
            <option key={p.slug} value={p.slug}>{p.displayName}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}
