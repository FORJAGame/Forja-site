import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBaseFixture, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

describe('guilds', () => {
  it('generates the slug from the name when it is left blank', async () => {
    const guild = await payload.create({
      collection: 'guilds',
      data: { name: 'Têmpera', slug: '', shortDescription: 'Áudio e trilha.' },
      overrideAccess: true,
    })
    expect(guild.slug).toBe('tempera')
  })

  it('lets an editor save a draft of their own guild', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    const updated = await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: { shortDescription: 'Narrativa e exploração.' },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect(updated.shortDescription).toBe('Narrativa e exploração.')
    expect(updated._status).toBe('draft')
  })

  it('forbids an editor from updating another guild', async () => {
    const { editorA, guildB } = await createBaseFixture(payload)

    await expect(
      payload.update({
        collection: 'guilds',
        id: guildB.id,
        data: { shortDescription: 'Invadido' },
        draft: true,
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const untouched = await payload.findByID({ collection: 'guilds', id: guildB.id })
    expect(untouched.shortDescription).toBe('Guilda Bigorna')
  })

  it('forbids editors from creating or deleting guilds', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)

    await expect(
      payload.create({
        collection: 'guilds',
        data: { name: 'Nova', slug: 'nova', shortDescription: 'x' },
        user: editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'guilds', id: guildA.id, user: editorA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('blocks deleting a guild that still has members', async () => {
    const { admin, guildA } = await createBaseFixture(payload)

    await expect(
      payload.delete({ collection: 'guilds', id: guildA.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow('Esta guilda ainda tem membros ou jogos')
  })
})
