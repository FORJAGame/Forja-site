'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noSubscription = () => () => {}

export function LivePreviewListener() {
  const router = useRouter()
  // The panel and the site share the origin; it is only known in the browser.
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => '')
  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
