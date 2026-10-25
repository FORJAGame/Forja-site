import { draftMode, headers } from 'next/headers'
import type { Payload } from 'payload'

import { PUBLIC_VIEWER, type Viewer } from '@/lib/viewer'

// The draft cookie alone is not enough: drafts are read as the panel user, so access rules still apply.
export const resolveViewer = async (payload: Payload): Promise<Viewer> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return PUBLIC_VIEWER
  const { user } = await payload.auth({ headers: await headers() })
  return user ? { draft: true, user } : PUBLIC_VIEWER
}
