import { useOutletContext } from 'react-router-dom'

/** `{ slug, overview, reloadOverview }` provided by ProfileGate. */
export function useCurrentProfile() {
  return useOutletContext()
}
