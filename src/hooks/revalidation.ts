import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// The site is small and a single change (a guild name) shows up on many pages, so publish refreshes them all.
export const PUBLIC_ROUTES: Array<[path: string, type?: 'page']> = [
  ['/'],
  ['/guildas'],
  ['/guildas/[slug]', 'page'],
  ['/jogos'],
  ['/jogos/[slug]', 'page'],
  ['/artigos'],
]

export const revalidatePublicSite = (): void => {
  for (const [path, type] of PUBLIC_ROUTES) {
    if (type) revalidatePath(path, type)
    else revalidatePath(path)
  }
}

const isPublic = (doc: { _status?: unknown }) => doc._status === undefined || doc._status === 'published'

export const revalidateOnPublish: CollectionAfterChangeHook = ({ doc, context }) => {
  if (!context.disableRevalidate && isPublic(doc)) revalidatePublicSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (!context.disableRevalidate) revalidatePublicSite()
  return doc
}
