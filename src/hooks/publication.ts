import { Forbidden, type CollectionBeforeChangeHook, type CollectionBeforeOperationHook } from 'payload'

import { isAdmin } from '@/access'

// Autosave keeps the live preview in sync while editors type; the explicit save button stays for reassurance.
export const draftVersions = {
  drafts: { autosave: { interval: 800, showSaveDraftButton: true } },
  maxPerDoc: 25,
} as const

// A non-draft write goes straight to the live document (Payload's unpublish path), even with `_status: 'draft'`.
export const requireDraftModeForNonAdmins: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  const writesLiveDocument = operation === 'update' || operation === 'restoreVersion'
  if (writesLiveDocument && req.user && !isAdmin(req.user) && !args.draft) {
    throw new Forbidden(req.t)
  }
  return args
}

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
