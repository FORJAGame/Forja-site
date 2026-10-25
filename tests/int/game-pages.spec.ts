import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { listArticles } from '@/lib/queries/articles'
import { getGamePage, listGames, listGameSlugs } from '@/lib/queries/games'
import { getGuildPage } from '@/lib/queries/guilds'

import {
  createArticle,
  createBaseFixture,
  createGame,
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

describe('game pages', () => {
  it('lists published games, newest first', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, { title: 'Primeiro' })
    await createGame(payload, guildA.id, { title: 'Segundo' })
    await createGame(payload, guildA.id, { title: 'Rascunho', _status: 'draft' })

    expect((await listGames(payload)).map((game) => game.title)).toEqual(['Segundo', 'Primeiro'])
    expect((await listGameSlugs(payload)).sort()).toEqual(['primeiro', 'segundo'])
  })

  it('keeps an old game in place when a correction is republished', async () => {
    const { guildA } = await createBaseFixture(payload)
    const older = await createGame(payload, guildA.id, { title: 'Primeiro' })
    await createGame(payload, guildA.id, { title: 'Segundo' })

    await payload.update({ collection: 'games', id: older.id, data: { synopsis: 'Sinopse corrigida.', _status: 'published' } })

    expect((await listGames(payload)).map((game) => game.title)).toEqual(['Segundo', 'Primeiro'])
    expect((await getGuildPage(payload, guildA.slug))?.games.map((game) => game.title)).toEqual(['Segundo', 'Primeiro'])
  })

  it('builds the game page with guild link, trailer id, date and credits', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, {
      trailerUrl: 'https://youtu.be/dQw4w9WgXcQ',
      playUrl: 'https://aurora.itch.io/ecos',
      credits: 'Ana — arte',
      releaseDate: '2026-09-01T00:00:00.000Z',
    })

    const page = await getGamePage(payload, 'ecos-de-ferro')

    expect(page?.guild).toEqual({ name: 'Aurora', href: '/guildas/aurora' })
    expect(page?.trailerVideoId).toBe('dQw4w9WgXcQ')
    expect(page?.playUrl).toBe('https://aurora.itch.io/ecos')
    expect(page?.releaseDate).toBe('setembro de 2026')
    expect(page?.credits).toBe('Ana — arte')
    expect(page?.gallery).toEqual([])
    expect(page?.description).toBeNull()
  })

  it('returns null for unknown or never-published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id, { title: 'Rascunho', _status: 'draft' })

    expect(await getGamePage(payload, 'rascunho')).toBeNull()
    expect(await getGamePage(payload, 'nao-existe')).toBeNull()
  })

  it('shows a brand-new game draft to its guild editor in preview mode only', async () => {
    const { editorA, editorB, guildA } = await createBaseFixture(payload)
    await payload.create({
      collection: 'games',
      data: { title: 'Maré Baixa', synopsis: 'Puzzle cooperativo.', guild: guildA.id },
      draft: true,
      user: editorA,
      overrideAccess: false,
    })

    expect((await getGamePage(payload, 'mare-baixa', { draft: true, user: editorA }))?.title).toBe('Maré Baixa')
    expect(await getGamePage(payload, 'mare-baixa', { draft: true, user: editorB })).toBeNull()
    expect(await getGamePage(payload, 'mare-baixa')).toBeNull()
  })

  it('lists every article, newest first', async () => {
    await createArticle(payload, { title: 'Antigo', date: '2024-01-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Novo', date: '2026-06-01T00:00:00.000Z' })

    expect((await listArticles(payload)).map((article) => article.title)).toEqual(['Novo', 'Antigo'])
  })
})
