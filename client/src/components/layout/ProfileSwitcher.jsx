import { UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useProfiles } from '@/features/profiles/useProfileData'
import { Select } from '@/components/ui/input'

export function ProfileSwitcher() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { data, loading, error } = useProfiles()
  const profiles = data?.profiles || []

  const onChange = (e) => {
    const next = e.target.value
    const suffix = slug ? pathname.slice(`/p/${slug}`.length) : ''
    navigate(`/p/${next}${suffix}${search}`)
  }

  return (
    <div className="relative flex items-center">
      <UserRound className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden />
      <label htmlFor="profile-switcher" className="sr-only">Demo profile</label>
      <Select
        id="profile-switcher"
        value={slug || ''}
        onChange={onChange}
        disabled={loading || !!error}
        className="h-9 min-w-44 pl-8 text-sm font-medium"
      >
        {!slug && <option value="" disabled>{loading ? 'Loading profiles…' : 'Choose a demo profile'}</option>}
        {profiles.map((p) => (
          <option key={p.slug} value={p.slug}>{p.displayName}</option>
        ))}
      </Select>
    </div>
  )
}
