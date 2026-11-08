import { FlaskConical, Radio } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getDataMode } from '@/lib/api'

/** Shows whether numbers come from the live FPS API or from labeled mock data (explicit mock mode only). */
export function DataSourceBadge() {
  useLocation() // re-evaluate when ?mock=1 / ?mock=0 changes
  const { mode, reason } = getDataMode()
  if (mode === 'live') {
    return (
      <Badge variant="success" title={`Numbers come from the FPS API at ${reason}`}>
        <Radio /> Live API
      </Badge>
    )
  }
  return (
    <Badge variant="warning" title={`Mock mode (${reason}): labeled synthetic responses captured from the FPS API. Add ?mock=0 to leave.`}>
      <FlaskConical /> Mock data
    </Badge>
  )
}
