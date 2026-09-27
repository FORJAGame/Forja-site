import { describe, expect, it } from 'vitest'

import { toArticleRow, toGameCard, toGuildCard, toMediaView } from '@/lib/presenters'
import type { Article, Game, Guild, Media } from '@/payload-types'

const timestamps = { createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }

const media = { id: 5, alt: 'Capa', url: '/api/media/file/capa.png', ...timestamps } as Media

const guild = {
  id: 1,
  name: 'Têmpera',
  slug: 'tempera',
  shortDescription: 'Áudio e trilha sonora.',
  members: 'Ana\n\nBruno\n  \nCarla',
  logo: null,
  ...timestamps,
} as Guild

const game = {
  id: 9,
  title: 'Ecos de Ferro',
  slug: 'ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  developmentStatus: 'in-development',
  platforms: ['pc', 'web'],
  guild,
  cover: media,
  ...timestamps,
} as Game

const article = {
  id: 3,
  title: 'Masmorras procedurais',
  description: 'x',
  authors: [{ name: 'Ana Lima' }, { name: 'Pedro Souza' }],
  date: '2026-09-01T00:00:00.000Z',
  venue: 'SBGames 2026',
  url: 'https://doi.org/10.1/x',
  ...timestamps,
} as Article

describe('toMediaView', () => {
  it('keeps only populated media with a URL', () => {
    expect(toMediaView(media)).toEqual({ url: '/api/media/file/capa.png', alt: 'Capa' })
    expect(toMediaView(5)).toBeNull()
    expect(toMediaView(null)).toBeNull()
    expect(toMediaView({ ...media, url: null })).toBeNull()
  })
})

describe('toGuildCard', () => {
  it('builds the card with link, initials and counts', () => {
    expect(toGuildCard(guild, 3)).toEqual({
      id: 1,
      name: 'Têmpera',
      href: '/guildas/tempera',
      focus: 'Áudio e trilha sonora.',
      initials: 'Tê',
      logo: null,
      meta: '3 jogos  ·  3 membros',
    })
  })

  it('omits members when the guild did not list any', () => {
    expect(toGuildCard({ ...guild, members: null }, 1).meta).toBe('1 jogo')
  })
})

describe('toGameCard', () => {
  it('builds the card with guild name, platform labels and cover', () => {
    expect(toGameCard(game)).toEqual({
      id: 9,
      title: 'Ecos de Ferro',
      href: '/jogos/ecos-de-ferro',
      synopsis: 'Um metroidvania.',
      status: 'in-development',
      guildName: 'Têmpera',
      platforms: ['PC', 'Web'],
      cover: { url: '/api/media/file/capa.png', alt: 'Capa' },
    })
  })

  it('tolerates an unpopulated guild and no platforms', () => {
    const card = toGameCard({ ...game, guild: 1, platforms: null, cover: null })

    expect(card.guildName).toBeNull()
    expect(card.platforms).toEqual([])
    expect(card.cover).toBeNull()
  })
})

describe('toArticleRow', () => {
  it('joins the authors and keeps the external link', () => {
    expect(toArticleRow(article)).toEqual({
      id: 3,
      title: 'Masmorras procedurais',
      url: 'https://doi.org/10.1/x',
      venue: 'SBGames 2026',
      authors: 'Ana Lima, Pedro Souza',
      date: '2026-09-01T00:00:00.000Z',
    })
  })
})
