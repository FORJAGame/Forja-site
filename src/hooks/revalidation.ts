import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// A single change (a guild name) shows up on many pages, so publishing refreshes the whole site.
// Every page carries the root layout tag; '/guildas/[slug]' would not match, because route groups
// such as (frontend) are part of a page's cache tag.
export const revalidatePublicSite = (): void => {
  revalidatePath('/', 'layout')
}

const isPublic = (doc?: { _status?: unknown } | null) =>
  Boolean(doc) && (doc?._status === undefined || doc?._status === 'published')

export const revalidateOnPublish: CollectionAfterChangeHook = ({ doc, previousDoc, context }) => {
  const changesPublicContent = isPublic(doc) || previousDoc?._status === 'published'
  if (!context.disableRevalidate && changesPublicContent) revalidatePublicSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (!context.disableRevalidate) revalidatePublicSite()
  return doc
}
