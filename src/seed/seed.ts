import type { Payload } from 'payload'

import { slugify } from '@/utilities/slugify'

import { articles, games, guilds } from './data'

export const SEED_ADMIN = { name: 'Admin Forja', email: 'admin@forja.local', password: 'forja-dev' }

const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds'] as const

export const seed = async (payload: Payload): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed wipes content and must never run in production.')
  }

  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }

  await payload.create({ collection: 'users', data: { ...SEED_ADMIN, role: 'admin' }, overrideAccess: true })

  const guildIdByName = new Map<string, number>()
  for (const guild of guilds) {
    const created = await payload.create({
      collection: 'guilds',
      data: { ...guild, slug: slugify(guild.name), _status: 'published' },
      overrideAccess: true,
    })
    guildIdByName.set(guild.name, created.id)
  }

  const guildId = (name: string): number => {
    const id = guildIdByName.get(name)
    if (id === undefined) throw new Error(`Seed references unknown guild "${name}"`)
    return id
  }

  for (const { guildName, ...game } of games) {
    await payload.create({
      collection: 'games',
      data: { ...game, slug: slugify(game.title), guild: guildId(guildName), _status: 'published' },
      overrideAccess: true,
    })
  }

  for (const { guildName, ...article } of articles) {
    await payload.create({
      collection: 'articles',
      data: { ...article, guild: guildName ? guildId(guildName) : null },
      overrideAccess: true,
    })
  }
}
