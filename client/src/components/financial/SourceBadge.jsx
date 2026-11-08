import { Database, FlaskConical, PencilLine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/** Visibly labels provenance per engineering.md §3.4/5.4: Nessie-imported, supplemental synthetic, or user-edited. */
export function SourceBadge({ source, className }) {
  if (source === 'supplemental_synthetic') {
    return (
      <Badge variant="synthetic" className={className} title="Supplemental synthetic data — not provided by Nessie">
        <FlaskConical /> Synthetic
      </Badge>
    )
  }
  if (source === 'nessie') {
    return (
      <Badge variant="outline" className={className} title="Imported from the Capital One Nessie sandbox (synthetic)">
        <Database /> Nessie
      </Badge>
    )
  }
  if (source === 'user_entered') {
    return (
      <Badge variant="primary" className={className} title="Added or changed in the app's profile editor (engineering.md 5.4)">
        <PencilLine /> Edited
      </Badge>
    )
  }
  return null
}

export function IllustrativeBadge({ children = 'Hypothetical', className }) {
  return (
    <Badge variant="synthetic" className={className} title="Illustrative assumption for demonstration only">
      <FlaskConical /> {children}
    </Badge>
  )
}
