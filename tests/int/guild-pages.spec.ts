import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getGuildPage, listGuilds, listGuildSlugs } from '@/lib/queries/guilds'
import type { Viewer } from '@/lib/viewer'

import { createBaseFixture, createGame, createGuild, getTestPayload, resetDatabase } from '../helpers/fixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await resetDatabase(payload)
})

const saveDraft = (guildId: number, shortDescription: string, user: Viewer['user']) =>
  payload.update({
    collection: 'guilds',
    id: guildId,
    data: { shortDescription },
    draft: true,
    user,
    overrideAccess: false,
  })

describe('guild pages', () => {
  it('lists every published guild in alphabetical order', async () => {
    await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    expect((await listGuilds(payload)).map((guild) => guild.name)).toEqual(['Aurora', 'Bigorna'])
    expect((await listGuildSlugs(payload)).sort()).toEqual(['aurora', 'bigorna'])
  })

  it('builds the guild page with links, members and published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    await payload.update({
      collection: 'guilds',
      id: guildA.id,
      data: {
        links: [{ platform: 'itch', url: 'https://aurora.itch.io' }],
        members: 'Ana\nBruno',
        _status: 'published',
      },
      overrideAccess: true,
    })
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const page = await getGuildPage(payload, 'aurora')

    expect(page?.links).toEqual([{ label: 'itch.io', url: 'https://aurora.itch.io' }])
    expect(page?.members).toEqual(['Ana', 'Bruno'])
    expect(page?.games.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('returns null for unknown or never-published guilds', async () => {
    await createGuild(payload, 'Rascunho', { _status: 'draft' })

    expect(await getGuildPage(payload, 'nao-existe')).toBeNull()
    expect(await getGuildPage(payload, 'rascunho')).toBeNull()
  })

  it('shows the pending draft to an editor of the guild previewing it', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await saveDraft(guildA.id, 'Rascunho novo', editorA)

    const preview = await getGuildPage(payload, 'aurora', { draft: true, user: editorA })
    const publicPage = await getGuildPage(payload, 'aurora')

    expect(preview?.shortDescription).toBe('Rascunho novo')
    expect(publicPage?.shortDescription).toBe('Guilda Aurora')
  })

  it('never shows another guild draft, even in preview mode', async () => {
    const { editorA, editorB, guildB } = await createBaseFixture(payload)
    await saveDraft(guildB.id, 'Segredo da Bigorna', editorB)

    const page = await getGuildPage(payload, 'bigorna', { draft: true, user: editorA })

    expect(page?.shortDescription).toBe('Guilda Bigorna')
  })

  it('never shows drafts to a preview cookie without a user', async () => {
    const { editorA, guildA } = await createBaseFixture(payload)
    await saveDraft(guildA.id, 'Rascunho novo', editorA)

    const page = await getGuildPage(payload, 'aurora', { draft: true, user: null })

    expect(page?.shortDescription).toBe('Guilda Aurora')
  })
})
