import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useProfiles } from '@/features/profiles/useProfileData'
import { getDataMode } from '@/lib/api'
import { invalidateApiData } from '@/lib/useApi'
import { EditDataDialog } from './EditDataDialog'

/**
 * Header control for profile editing (engineering.md 5.4). Live API only: in mock mode the fixtures are
 * read-only, so the button is disabled and says why. A successful save invalidates every cached response,
 * which re-keys data hooks and remounts the current page so all numbers refetch.
 */
export function EditDataButton({ slug }) {
  useLocation() // re-evaluate the data mode on ?mock=1 / ?mock=0
  const { mode } = getDataMode()
  const [open, setOpen] = useState(false)
  const profiles = useProfiles()
  const displayName = profiles.data?.profiles?.find((p) => p.slug === slug)?.displayName
  const mock = mode === 'mock'

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={mock}
        onClick={() => setOpen(true)}
        title={mock ? 'Editing needs the live API. Mock data is read-only.' : `Edit ${displayName || 'this profile'}’s balances, income, bills, loans and spending`}
        aria-label={mock ? 'Edit data (unavailable in mock mode)' : 'Edit profile data'}
      >
        <Pencil /> <span className="hidden sm:inline">Edit data</span>
      </Button>
      {!mock && (
        <EditDataDialog slug={slug} displayName={displayName} open={open} onClose={() => setOpen(false)} onChanged={invalidateApiData} />
      )}
    </>
  )
}
