import { Forbidden, type CollectionBeforeChangeHook } from 'payload'

import { isAdmin } from '@/access'

export const draftVersions = { drafts: true, maxPerDoc: 25 } as const

// Requests without a user come from trusted server code (seed, scripts) running with overrideAccess.
export const requireDraftForNonAdmins: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user && !isAdmin(req.user) && data._status !== 'draft') {
    throw new Forbidden(req.t)
  }
  return data
}

export const recordPublisher: CollectionBeforeChangeHook = ({ data, req }) => {
  if (data._status !== 'published') return data
  return { ...data, publishedBy: req.user?.id ?? null, publishedAt: new Date().toISOString() }
}
