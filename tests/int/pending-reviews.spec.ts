import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { listPendingReviews } from '@/lib/pendingReviews'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('listPendingReviews', () => {
  it('is empty when everything is published', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)

    expect(await listPendingReviews(payload)).toEqual([])
  })

  it('lists editor drafts of guilds and games, newest first', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Nova descrição' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })
    await payload.update({
      collection: 'games',
      id: game.id,
      data: { title: 'Ecos de Ferro 2' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const reviews = await listPendingReviews(payload)

    expect(reviews.map(({ collection, id, title }) => ({ collection, id, title }))).toEqual([
      { collection: 'games', id: game.id, title: 'Ecos de Ferro 2' },
      { collection: 'guilds', id: guildA.id, title: 'Aurora' },
    ])
  })

  it('includes brand-new games that were never published', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await payload.create({
      collection: 'games',
      data: { title: 'Circuito 404', synopsis: 'Roguelike de cartas.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const reviews = await listPendingReviews(payload)

    expect(reviews.map((review) => review.title)).toEqual(['Circuito 404'])
  })

  // With autosave, just opening "Criar novo" creates an empty draft; nobody sent it for review.
  it('ignores untitled drafts left behind by an abandoned form', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await payload.create({
      collection: 'games',
      data: { guild: guildA.id } as never,
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect(await listPendingReviews(payload)).toEqual([])
  })

  it('drops an item once an admin publishes it', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)
    await payload.update({
      collection: 'games',
      id: game.id,
      data: { title: 'Aprovado' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    await payload.update({
      collection: 'games',
      id: game.id,
      data: { _status: 'published' },
      user: admin,
      overrideAccess: false,
    })

    expect(await listPendingReviews(payload)).toEqual([])
  })
})
