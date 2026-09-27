import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { expect } from 'vitest'

import type { Game, Guild, User } from '@/payload-types'
import { slugify } from '@/utilities/slugify'

export type TestUser = User & { collection: 'users' }

// Payload's ValidationError message only names the field; the field's own message lives in data.errors.
export const expectFieldError = async (operation: Promise<unknown>, path: string, message: string) => {
  await expect(operation).rejects.toMatchObject({
    status: 400,
    data: {
      errors: expect.arrayContaining([expect.objectContaining({ path, message: expect.stringContaining(message) })]),
    },
  })
}

const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds'] as const

export const getTestPayload = (): Promise<Payload> => getPayload({ config })

export const resetDatabase = async (payload: Payload): Promise<void> => {
  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
}

let userSequence = 0

export const createUser = async (
  payload: Payload,
  { role, guild = null }: { role: User['role']; guild?: number | null },
): Promise<TestUser> => {
  userSequence += 1
  const user = await payload.create({
    collection: 'users',
    data: {
      name: `${role} ${userSequence}`,
      email: `${role}-${userSequence}@forja.test`,
      password: 'test-password',
      role,
      guild,
    },
    overrideAccess: true,
  })
  return { ...user, collection: 'users' }
}

export const createGuild = (payload: Payload, name: string, overrides: Partial<Guild> = {}): Promise<Guild> =>
  payload.create({
    collection: 'guilds',
    data: { name, slug: slugify(name), shortDescription: `Guilda ${name}`, _status: 'published', ...overrides },
    overrideAccess: true,
  })

export const createGame = (payload: Payload, guildId: number, overrides: Partial<Game> = {}): Promise<Game> => {
  const title = overrides.title ?? 'Ecos de Ferro'
  return payload.create({
    collection: 'games',
    data: {
      title,
      slug: slugify(title),
      synopsis: 'Um metroidvania sobre uma ferreira que reconstrói uma cidade mecânica.',
      guild: guildId,
      developmentStatus: 'in-development',
      _status: 'published',
      ...overrides,
    },
    overrideAccess: true,
  })
}

// The first user ever created becomes admin (see assignFirstUserAsAdmin), so the admin must come first.
export const createBaseFixture = async (payload: Payload) => {
  const admin = await createUser(payload, { role: 'admin' })
  const guildA = await createGuild(payload, 'Aurora')
  const guildB = await createGuild(payload, 'Bigorna')
  const editorA = await createUser(payload, { role: 'editor', guild: guildA.id })
  const editorB = await createUser(payload, { role: 'editor', guild: guildB.id })
  return { admin, guildA, guildB, editorA, editorB }
}
