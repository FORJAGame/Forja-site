import { describe, expect, it } from 'vitest'

import {
  adminOnly,
  adminOnlyField,
  adminOrGuildMember,
  adminOrOwnGuild,
  adminOrSelf,
  getUserGuildId,
  isAdmin,
  publishedOrOwnGuild,
  type SessionUser,
} from '@/access'

type AccessArgs = Parameters<typeof adminOnly>[0]
type FieldAccessArgs = Parameters<typeof adminOnlyField>[0]

const argsFor = (user: SessionUser | null) => ({ req: { user } }) as unknown as AccessArgs
const fieldArgsFor = (user: SessionUser | null) => ({ req: { user } }) as unknown as FieldAccessArgs

const admin: SessionUser = { id: 1, role: 'admin', guild: null }
const editor: SessionUser = { id: 2, role: 'editor', guild: 7 }
const editorWithPopulatedGuild: SessionUser = { id: 3, role: 'editor', guild: { id: 7 } }
const editorWithoutGuild: SessionUser = { id: 4, role: 'editor', guild: null }

const published = { _status: { equals: 'published' } }

describe('isAdmin', () => {
  it('is true only for the admin role', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(editor)).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })
})

describe('getUserGuildId', () => {
  it('reads the guild id whether the relation is populated or not', () => {
    expect(getUserGuildId(editor)).toBe(7)
    expect(getUserGuildId(editorWithPopulatedGuild)).toBe(7)
  })

  it('returns null when there is no guild or no user', () => {
    expect(getUserGuildId(editorWithoutGuild)).toBeNull()
    expect(getUserGuildId(null)).toBeNull()
  })
})

describe('adminOnly / adminOnlyField', () => {
  it('allows only admins', () => {
    expect(adminOnly(argsFor(admin))).toBe(true)
    expect(adminOnly(argsFor(editor))).toBe(false)
    expect(adminOnly(argsFor(null))).toBe(false)
    expect(adminOnlyField(fieldArgsFor(admin))).toBe(true)
    expect(adminOnlyField(fieldArgsFor(editor))).toBe(false)
  })
})

describe('adminOrSelf', () => {
  it('scopes non-admins to their own document', () => {
    expect(adminOrSelf(argsFor(admin))).toBe(true)
    expect(adminOrSelf(argsFor(editor))).toEqual({ id: { equals: 2 } })
    expect(adminOrSelf(argsFor(null))).toBe(false)
  })
})

describe('adminOrGuildMember', () => {
  it('requires a guild for non-admins', () => {
    expect(adminOrGuildMember(argsFor(admin))).toBe(true)
    expect(adminOrGuildMember(argsFor(editor))).toBe(true)
    expect(adminOrGuildMember(argsFor(editorWithoutGuild))).toBe(false)
    expect(adminOrGuildMember(argsFor(null))).toBe(false)
  })
})

describe('adminOrOwnGuild', () => {
  const access = adminOrOwnGuild('guild')

  it('scopes editors to documents of their guild', () => {
    expect(access(argsFor(admin))).toBe(true)
    expect(access(argsFor(editor))).toEqual({ guild: { equals: 7 } })
    expect(access(argsFor(editorWithPopulatedGuild))).toEqual({ guild: { equals: 7 } })
  })

  it('denies users without a guild and anonymous visitors', () => {
    expect(access(argsFor(editorWithoutGuild))).toBe(false)
    expect(access(argsFor(null))).toBe(false)
  })
})

describe('publishedOrOwnGuild', () => {
  const access = publishedOrOwnGuild('guild')

  it('lets admins read everything', () => {
    expect(access(argsFor(admin))).toBe(true)
  })

  it('limits anonymous visitors and guildless users to published documents', () => {
    expect(access(argsFor(null))).toEqual(published)
    expect(access(argsFor(editorWithoutGuild))).toEqual(published)
  })

  it('lets editors also read their own guild documents', () => {
    expect(access(argsFor(editor))).toEqual({ or: [published, { guild: { equals: 7 } }] })
  })
})
