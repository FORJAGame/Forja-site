import type { CollectionBeforeChangeHook } from 'payload'

import { getUserGuildId, isAdmin } from '@/access'

export const assignOwnGuild: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.user || isAdmin(req.user)) return data
  return { ...data, guild: getUserGuildId(req.user) }
}
