import type { Payload } from 'payload'

import {
  type ArticleRowView,
  type GameCardView,
  type GuildCardView,
  toArticleRow,
  toGameCard,
  toGuildCard,
} from '@/lib/presenters'

import { countPublishedGamesByGuild } from './counts'

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

export const getLandingData = async (payload: Payload): Promise<LandingData> => {
  const [guilds, featuredGames, articles, gamesByGuild] = await Promise.all([
    payload.find({ collection: 'guilds', ...asVisitor, sort: 'name', limit: FEATURED_GUILDS, depth: 1 }),
    payload.find({ collection: 'games', ...asVisitor, sort: '-createdAt', limit: FEATURED_GAMES, depth: 1 }),
    payload.find({ collection: 'articles', ...asVisitor, sort: '-date', limit: RECENT_ARTICLES, depth: 0 }),
    countPublishedGamesByGuild(payload),
  ])
  const publishedGames = [...gamesByGuild.values()].reduce((total, count) => total + count, 0)

  return {
    stats: { guilds: guilds.totalDocs, games: publishedGames, articles: articles.totalDocs },
    guilds: guilds.docs.map((guild) => toGuildCard(guild, gamesByGuild.get(guild.id) ?? 0)),
    games: featuredGames.docs.map(toGameCard),
    articles: articles.docs.map(toArticleRow),
  }
}
