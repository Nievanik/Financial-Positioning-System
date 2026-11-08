import { UserX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/buttonVariants'
import { Card } from '@/components/ui/card'

export default function ProfileNotFound({ slug }) {
  return (
    <Card className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <UserX className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">Demo profile not found</h1>
      <p className="text-sm text-muted-foreground">
        {slug ? <>There is no demo profile called “{slug}”. </> : null}FPS includes exactly three fictional profiles.
      </p>
      <Link to="/" className={buttonClasses()}>Choose a profile</Link>
    </Card>
  )
}
