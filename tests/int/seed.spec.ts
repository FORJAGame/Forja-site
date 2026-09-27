import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_SEED_ADMIN } from '@/seed/admin'
import { seed } from '@/seed/seed'

import { getTestPayload } from '../helpers/fixtures'
import { objectExists } from '../helpers/storage'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const countAll = async () => ({
  users: (await payload.count({ collection: 'users' })).totalDocs,
  guilds: (await payload.count({ collection: 'guilds' })).totalDocs,
  games: (await payload.count({ collection: 'games' })).totalDocs,
  articles: (await payload.count({ collection: 'articles' })).totalDocs,
  media: (await payload.count({ collection: 'media' })).totalDocs,
})

// 3 game covers + 3 gallery images for the first game.
const SEEDED = { users: 1, guilds: 8, games: 3, articles: 3, media: 6 }

describe('seed', () => {
  it('creates the prototype content, published and visible to visitors', async () => {
    await seed(payload)

    expect(await countAll()).toEqual(SEEDED)
    const visibleGames = await payload.find({ collection: 'games', overrideAccess: false })
    expect(visibleGames.totalDocs).toBe(3)
    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: LOCAL_SEED_ADMIN.email } } })
    expect(docs[0].role).toBe('admin')
  })

  it('gives every game a cover stored in the bucket and a gallery to the first one', async () => {
    await seed(payload)

    const { docs } = await payload.find({ collection: 'games', depth: 1, sort: 'createdAt', overrideAccess: false })
    for (const game of docs) {
      expect(typeof game.cover === 'object' && game.cover?.url).toMatch(/^\/api\/media\/file\//)
    }
    expect(docs[0].gallery).toHaveLength(3)
  })

  it('stores every seeded image in the bucket, also when it runs again', async () => {
    for (const run of [1, 2]) {
      await seed(payload)

      const { docs } = await payload.find({ collection: 'media', pagination: false })
      const stored = await Promise.all(docs.map((media) => objectExists(media.filename!)))
      expect(stored, `run ${run}`).toEqual(docs.map(() => true))
    }
  })

  it('creates the admin it is given', async () => {
    const admin = { name: 'Profa. Teste', email: 'profa@forja.test', password: 'uma-senha-bem-longa' }
    await seed(payload, admin)

    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: admin.email } } })
    expect(docs).toHaveLength(1)
  })

  it('can run again without duplicating content or images', async () => {
    await seed(payload)
    await seed(payload)

    expect(await countAll()).toEqual(SEEDED)
  })
})
