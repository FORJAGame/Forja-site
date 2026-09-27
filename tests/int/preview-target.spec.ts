import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resolvePreviewTarget } from '@/lib/queries/preview'

import { createBaseFixture, createGame, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('resolvePreviewTarget', () => {
  it('sends an editor to the public page of their own draft', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const draft = await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect(await resolvePreviewTarget(payload, editorA, 'games', String(draft.id))).toEqual({ path: '/jogos/mare-baixa' })
    expect(await resolvePreviewTarget(payload, editorA, 'guilds', String(guildA.id))).toEqual({ path: '/guildas/aurora' })
  })

  it('refuses anyone who is not logged in to the panel', async () => {
    const { guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    expect(await resolvePreviewTarget(payload, null, 'games', String(game.id))).toMatchObject({ status: 401 })
  })

  it('hides documents of other guilds', async () => {
    const { editorB, guildA } = await createBaseFixture(payload)
    const draft = await createGame(payload, guildA.id, { title: 'Segredo', _status: 'draft' })

    expect(await resolvePreviewTarget(payload, editorB, 'games', String(draft.id))).toMatchObject({ status: 404 })
  })

  it('rejects unknown collections and missing ids', async () => {
    const { admin } = await createBaseFixture(payload)

    expect(await resolvePreviewTarget(payload, admin, 'users', '1')).toMatchObject({ status: 400 })
    expect(await resolvePreviewTarget(payload, admin, 'games', null)).toMatchObject({ status: 400 })
    expect(await resolvePreviewTarget(payload, admin, 'games', '999999')).toMatchObject({ status: 404 })
  })
})
