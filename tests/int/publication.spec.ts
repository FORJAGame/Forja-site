import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, createGuild, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('publication workflow (guilds)', () => {
  it('keeps the published version live while an editor draft waits for approval', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Rascunho novo' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const live = await payload.findByID({ collection: 'guilds', id: guildA.id, overrideAccess: false })
    const draft = await payload.findByID({
      collection: 'guilds',
      id: guildA.id,
      draft: true,
      user: editorA,
      overrideAccess: false,
    })
    expect(live.shortDescription).toBe('Guilda Aurora')
    expect(draft.shortDescription).toBe('Rascunho novo')
  })

  it('forbids an editor from saving without draft mode', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildA.id,
        data: { shortDescription: 'Direto no ar' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('forbids an editor from publishing explicitly', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildA.id,
        data: { shortDescription: 'Publicado pelo editor', _status: 'published' },
        draft: true,
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const live = await payload.findByID({ collection: 'guilds', id: guildA.id })
    expect(live.shortDescription).toBe('Guilda Aurora')
  })

  it('publishes the pending draft when an admin approves it and records who did it', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)
    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Aprovado' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const published = await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { _status: 'published' },
      user: admin,
      overrideAccess: false,
      depth: 0,
    })

    expect(published.shortDescription).toBe('Aprovado')
    expect(published.publishedBy).toBe(admin.id)
    expect(published.publishedAt).toEqual(expect.any(String))
  })

  it('never shows unpublished guilds to anonymous visitors', async () => {
    await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    const { docs } = await payload.find({ collection: 'guilds', overrideAccess: false })

    expect(docs.map((guild) => guild.name).sort()).toEqual(['Aurora', 'Bigorna'])
  })

  it('forbids an editor from unpublishing by saving a draft status outside draft mode', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildA.id,
        data: { shortDescription: 'Vandalizado', _status: 'draft' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const { docs } = await payload.find({ collection: 'guilds', overrideAccess: false })
    expect(docs.map((guild) => guild.shortDescription)).toContain('Guilda Aurora')
  })

  it('forbids an editor from restoring a version outside draft mode', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Rascunho' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })
    const { docs: versions } = await payload.findVersions({
      collection: 'guilds',
      where: { parent: { equals: guildA.id } },
      sort: '-updatedAt',
    })

    await expect(
      payload.restoreVersion({ collection: 'guilds', id: versions[0].id, user: editorA, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })

    const live = await payload.findByID({ collection: 'guilds', id: guildA.id, overrideAccess: false })
    expect(live.shortDescription).toBe('Guilda Aurora')
  })

  it('lets an editor read the version history of their own guild only', async () => {
    const { editorA, editorB, guildA, guildB } = await createBaseFixture(payload)
    for (const [editor, guild] of [
      [editorA, guildA],
      [editorB, guildB],
    ] as const) {
      await payload.update({
        collection: 'guilds',
        id: guild.id,
        data: { shortDescription: 'Rascunho' },
        draft: true,
        user: editor,
        overrideAccess: false,
      })
    }

    const { docs } = await payload.findVersions({ collection: 'guilds', user: editorA, overrideAccess: false })

    expect(docs.length).toBeGreaterThan(0)
    expect(new Set(docs.map((version) => version.parent))).toEqual(new Set([guildA.id]))
  })

  it('ignores publication fields forged by an editor', async () => {
    const { admin, editorA, guildA } = await createBaseFixture(payload)

    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { publishedBy: admin.id, publishedAt: '2020-01-01T00:00:00.000Z' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    const draft = await payload.findByID({ collection: 'guilds', id: guildA.id, draft: true, depth: 0 })
    expect(draft.publishedBy ?? null).toBe(guildA.publishedBy ?? null)
    expect(draft.publishedAt).toBe(guildA.publishedAt)
    expect(draft.publishedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })
})
