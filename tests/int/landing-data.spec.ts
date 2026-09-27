import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getLandingData } from '@/lib/queries/landing'

import {
  createArticle,
  createBaseFixture,
  createGame,
  createGuild,
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

describe('getLandingData', () => {
  it('returns empty sections and zero counts when nothing is published', async () => {
    expect(await getLandingData(payload)).toEqual({
      stats: { guilds: 0, games: 0, articles: 0 },
      guilds: [],
      games: [],
      articles: [],
    })
  })

  it('shows only published guilds and games to visitors', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGuild(payload, 'Rascunho', { _status: 'draft' })
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Protótipo secreto', _status: 'draft' })

    const data = await getLandingData(payload)

    expect(data.stats).toEqual({ guilds: 2, games: 1, articles: 0 })
    expect(data.guilds.map((guild) => guild.name)).toEqual(['Aurora', 'Bigorna'])
    expect(data.games.map((game) => game.title)).toEqual(['Ecos de Ferro'])
  })

  it('counts published games per guild on the guild cards', async () => {
    const { guildA } = await createBaseFixture(payload)
    await createGame(payload, guildA.id)
    await createGame(payload, guildA.id, { title: 'Maré Baixa' })

    const { guilds } = await getLandingData(payload)

    expect(guilds.find((guild) => guild.name === 'Aurora')?.meta).toBe('2 jogos')
    expect(guilds.find((guild) => guild.name === 'Bigorna')?.meta).toBe('0 jogos')
  })

  it('features the three most recently published games', async () => {
    const { guildA } = await createBaseFixture(payload)
    for (const title of ['Primeiro', 'Segundo', 'Terceiro', 'Quarto']) {
      await createGame(payload, guildA.id, { title })
    }

    const { games, stats } = await getLandingData(payload)

    expect(stats.games).toBe(4)
    expect(games.map((game) => game.title)).toEqual(['Quarto', 'Terceiro', 'Segundo'])
    expect(games[0].guildName).toBe('Aurora')
  })

  it('lists the three most recent articles by publication date', async () => {
    await createArticle(payload, { title: 'Antigo', date: '2024-01-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Novo', date: '2026-06-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Médio', date: '2025-03-01T00:00:00.000Z' })
    await createArticle(payload, { title: 'Mais antigo', date: '2023-01-01T00:00:00.000Z' })

    const { articles, stats } = await getLandingData(payload)

    expect(stats.articles).toBe(4)
    expect(articles.map((article) => article.title)).toEqual(['Novo', 'Médio', 'Antigo'])
  })

  it('shows at most eight guilds, in alphabetical order', async () => {
    for (const name of ['Juno', 'Ímã', 'Hélio', 'Gama', 'Fênix', 'Eco', 'Delta', 'Cobre', 'Brasa']) {
      await createGuild(payload, name)
    }

    const { guilds, stats } = await getLandingData(payload)

    expect(stats.guilds).toBe(9)
    expect(guilds).toHaveLength(8)
    expect(guilds[0].name).toBe('Brasa')
  })
})
