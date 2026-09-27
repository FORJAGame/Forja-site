import type { Payload } from 'payload'

import {
  type ArticleRowView,
  type GameCardView,
  type GuildCardView,
  toArticleRow,
  toGameCard,
  toGuildCard,
} from '@/lib/presenters'

export type LandingStats = { guilds: number; games: number; articles: number }

export type LandingData = {
  stats: LandingStats
  guilds: GuildCardView[]
  games: GameCardView[]
  articles: ArticleRowView[]
}

const FEATURED_GUILDS = 8
const FEATURED_GAMES = 3
const RECENT_ARTICLES = 3

const asVisitor = { overrideAccess: false } as const

const countGamesByGuild = (games: Array<{ guild: number | { id: number } }>): Map<number, number> => {
  const counts = new Map<number, number>()
  for (const { guild } of games) {
    const guildId = typeof guild === 'object' ? guild.id : guild
    counts.set(guildId, (counts.get(guildId) ?? 0) + 1)
  }
  return counts
}

export const getLandingData = async (payload: Payload): Promise<LandingData> => {
  const [guilds, featuredGames, articles, allGames] = await Promise.all([
    payload.find({ collection: 'guilds', ...asVisitor, sort: 'name', limit: FEATURED_GUILDS, depth: 1 }),
    payload.find({ collection: 'games', ...asVisitor, sort: '-publishedAt', limit: FEATURED_GAMES, depth: 1 }),
    payload.find({ collection: 'articles', ...asVisitor, sort: '-date', limit: RECENT_ARTICLES, depth: 0 }),
    payload.find({ collection: 'games', ...asVisitor, pagination: false, depth: 0, select: { guild: true } }),
  ])
  const gamesByGuild = countGamesByGuild(allGames.docs)

  return {
    stats: { guilds: guilds.totalDocs, games: allGames.totalDocs, articles: articles.totalDocs },
    guilds: guilds.docs.map((guild) => toGuildCard(guild, gamesByGuild.get(guild.id) ?? 0)),
    games: featuredGames.docs.map(toGameCard),
    articles: articles.docs.map(toArticleRow),
  }
}
