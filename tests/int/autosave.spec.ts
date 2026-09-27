import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('autosave', () => {
  it('lets an editor autosave a draft without publishing it', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await payload.update({
      collection: 'games',
      id: game.id,
      data: { synopsis: 'Digitando…' },
      draft: true,
      autosave: true,
      user: editorA,
      overrideAccess: false,
    })

    const live = await payload.findByID({ collection: 'games', id: game.id, overrideAccess: false })
    expect(live.synopsis).toBe(game.synopsis)
  })

  it('lets two untitled drafts coexist', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const untitledDraft = () =>
      payload.create({
        collection: 'games',
        data: { guild: guildA.id } as never,
        draft: true,
        user: editorA,
        overrideAccess: false,
      })

    const first = await untitledDraft()
    const second = await untitledDraft()

    expect(first.slug ?? null).toBeNull()
    expect(second.slug ?? null).toBeNull()
  })
})
