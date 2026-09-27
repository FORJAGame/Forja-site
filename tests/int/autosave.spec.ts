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
  it('keeps deriving the slug from the title while an unpublished draft is autosaved', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const asEditor = { user: editorA, overrideAccess: false, draft: true } as const
    // With autosave, "Criar novo" creates an empty draft before the editor types anything.
    const draft = await payload.create({ collection: 'games', data: { guild: guildA.id } as never, ...asEditor })
    const firstPause = await payload.update({ collection: 'games', id: draft.id, data: { title: 'Ecos d' }, autosave: true, ...asEditor })
    expect(firstPause.slug).toBe('ecos-d')

    // The form still holds the slug from the previous autosave while the editor keeps typing.
    await payload.update({ collection: 'games', id: draft.id, data: { title: 'Ecos de Vidro', slug: firstPause.slug }, autosave: true, ...asEditor })

    const latest = await payload.findByID({ collection: 'games', id: draft.id, ...asEditor })
    expect(latest.slug).toBe('ecos-de-vidro')
  })

  it('keeps a slug the editor typed by hand', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    const asEditor = { user: editorA, overrideAccess: false, draft: true } as const
    const draft = await payload.create({ collection: 'games', data: { guild: guildA.id } as never, ...asEditor })

    await payload.update({ collection: 'games', id: draft.id, data: { title: 'Ecos', slug: 'ecos-custom' }, autosave: true, ...asEditor })
    await payload.update({ collection: 'games', id: draft.id, data: { title: 'Ecos de Vidro', slug: 'ecos-custom' }, autosave: true, ...asEditor })

    const latest = await payload.findByID({ collection: 'games', id: draft.id, ...asEditor })
    expect(latest.slug).toBe('ecos-custom')
  })

  it('stops changing the slug once the document is published, so links keep working', async () => {
    const { admin, guildA } = await createBaseFixture(payload)
    const game = await createGame(payload, guildA.id)

    await payload.update({
      collection: 'games',
      id: game.id,
      data: { title: 'Ecos de Aço', slug: game.slug, _status: 'published' },
      user: admin,
      overrideAccess: false,
    })

    const live = await payload.findByID({ collection: 'games', id: game.id })
    expect(live.slug).toBe('ecos-de-ferro')
  })
})
