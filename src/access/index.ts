import type { Access, FieldAccess, Where } from 'payload'

export type Role = 'admin' | 'editor'

type GuildReference = number | { id: number } | null | undefined

export type SessionUser = {
  id: number | string
  role?: Role | null
  guild?: GuildReference
}

export const isAdmin = (user?: SessionUser | null): boolean => user?.role === 'admin'

export const getUserGuildId = (user?: SessionUser | null): number | null => {
  const guild = user?.guild
  if (guild === null || guild === undefined) return null
  return typeof guild === 'object' ? guild.id : guild
}

const published: Where = { _status: { equals: 'published' } }

export const anyone: Access = () => true

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req.user)

export const adminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  return { id: { equals: req.user.id } }
}

export const adminOrGuildMember: Access = ({ req }) =>
  isAdmin(req.user) || getUserGuildId(req.user) !== null

export const adminOrOwnGuild =
  (guildField: string): Access =>
  ({ req }) => {
    if (isAdmin(req.user)) return true
    const guildId = getUserGuildId(req.user)
    if (guildId === null) return false
    return { [guildField]: { equals: guildId } }
  }

export const publishedOrOwnGuild =
  (guildField: string): Access =>
  ({ req }) => {
    if (isAdmin(req.user)) return true
    const guildId = getUserGuildId(req.user)
    if (guildId === null) return published
    return { or: [published, { [guildField]: { equals: guildId } }] }
  }
