import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createBaseFixture,
  createGame,
  createGuild,
  expectFieldError,
  getTestPayload,
  resetDatabase,
} from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('games', () => {
  it('always files an editor-created game under the editor guild', async () => {
    const { editorA, guildA, guildB } = await createBaseFixture(payload)

    const game = await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle cooperativo.', guild: guildB.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
      depth: 0,
    })

    expect(game.guild).toBe(guildA.id)
    expect(game._status).toBe('draft')
    expect(game.slug).toBe('mare-baixa')
  })

  it('forbids an editor from editing a game of another guild', async () => {
    const { editorA, guildB } = await createBaseFixture(payload)
    const game = await createGame(payload, guildB.id)

    await expect(
      payload.update({
        collection: 'games',
        id: game.id,
        data: { title: 'Invadido' },
        draft: true,
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('keeps an editor from moving their game to another guild', async () => {
    const { editorA, guildA, guildB } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    const draft = await payload.update({
      collection: 'games',
      id: game.id,
      data: { guild: guildB.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
      depth: 0,
    })

    expect(draft.guild).toBe(guildA.id)
  })

  it('forbids an editor from publishing a game', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await expect(
      payload.update({
        collection: 'games',
        id: game.id,
        data: { title: 'Direto no ar' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const live = await payload.findByID({ collection: 'games', id: game.id })
    expect(live.title).toBe('Ecos de Ferro')
  })

  it('forbids editors from deleting published games', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await expect(
      payload.delete({ collection: 'games', id: game.id, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('lets editors delete never-published drafts of their own guild only', async () => {
    const { editorA, editorB, guildA } = await createBaseFixture(payload)
    const draft = await payload.create({
      collection: 'games',
      data: { guild: guildA.id } as never,
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    await expect(
      payload.delete({ collection: 'games', id: draft.id, user: editorB, overrideAccess: false }),
    ).rejects.toThrow()
    await payload.delete({ collection: 'games', id: draft.id, user: editorA, overrideAccess: false })

    const remaining = await payload.find({ collection: 'games', where: { id: { equals: draft.id } }, draft: true })
    expect(remaining.docs).toHaveLength(0)
  })

  it('forbids editors from deleting a game that was published and later unpublished', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)
    await payload.update({ collection: 'games', id: game.id, data: { _status: 'draft' }, user: admin, overrideAccess: false })

    await expect(
      payload.delete({ collection: 'games', id: game.id, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('shows only published games to anonymous visitors', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const { docs } = await payload.find({ collection: 'games', overrideAccess: false })

    expect(docs.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('rejects a trailer that is not a YouTube link when publishing', async () => {
    const { guildA } = await createBaseFixture(payload)

    await expectFieldError(
      createGame(payload, guildA.id, { trailerUrl: 'https://vimeo.com/1' }),
      'trailerUrl',
      'Use um link do YouTube',
    )
  })

  it('blocks deleting a guild that still has games', async () => {
    const { admin } = await createBaseFixture(payload)
    const guildWithoutMembers = await createGuild(payload, 'Centelha')
    await createGame(payload, guildWithoutMembers.id)

    await expect(
      payload.delete({ collection: 'guilds', id: guildWithoutMembers.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow('Esta guilda ainda tem membros ou jogos')
  })

  it('forbids an editor from unpublishing a game outside draft mode', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await expect(
      payload.update({
        collection: 'games',
        id: game.id,
        data: { title: 'Vandalizado', _status: 'draft' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const { docs } = await payload.find({ collection: 'games', overrideAccess: false })
    expect(docs.map((visible) => visible.title)).toEqual(['Ecos de Ferro'])
  })

  it('lets an editor read the version history of their own guild games only', async () => {
    const { editorA, editorB, guildA, guildB } = await createBaseFixture(payload)
    const gameA = await createGame(payload, guildA.id)
    const gameB = await createGame(payload, guildB.id, { title: 'Maré Baixa' })
    for (const [editor, game] of [
      [editorA, gameA],
      [editorB, gameB],
    ] as const) {
      await payload.update({
        collection: 'games',
        id: game.id,
        data: { synopsis: 'Rascunho' },
        draft: true,
        user: editor,
        overrideAccess: false,
      })
    }

    const { docs } = await payload.findVersions({ collection: 'games', user: editorA, overrideAccess: false })
    const { totalDocs } = await payload.countVersions({ collection: 'games', user: editorA, overrideAccess: false })

    expect(docs.length).toBeGreaterThan(0)
    expect(totalDocs).toBe(docs.length)
    expect(new Set(docs.map((version) => version.parent))).toEqual(new Set([gameA.id]))
  })
})
