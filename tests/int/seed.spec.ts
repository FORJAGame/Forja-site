import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { SEED_ADMIN, seed } from '@/seed/seed'

import { getTestPayload } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const countAll = async () => ({
  users: (await payload.count({ collection: 'users' })).totalDocs,
  guilds: (await payload.count({ collection: 'guilds' })).totalDocs,
  games: (await payload.count({ collection: 'games' })).totalDocs,
  articles: (await payload.count({ collection: 'articles' })).totalDocs,
})

describe('seed', () => {
  it('creates the prototype content, published and visible to visitors', async () => {
    await seed(payload)

    expect(await countAll()).toEqual({ users: 1, guilds: 8, games: 3, articles: 3 })
    const visibleGames = await payload.find({ collection: 'games', overrideAccess: false })
    expect(visibleGames.totalDocs).toBe(3)
    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: SEED_ADMIN.email } } })
    expect(docs[0].role).toBe('admin')
  })

  it('can run again without duplicating content', async () => {
    await seed(payload)
    await seed(payload)

    expect(await countAll()).toEqual({ users: 1, guilds: 8, games: 3, articles: 3 })
  })
})
