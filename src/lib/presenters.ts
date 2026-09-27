import type { Article, Game, Guild, Media } from '@/payload-types'
import { pluralize } from '@/utilities/pluralize'

import type { DevelopmentStatus, MediaView } from './views'

export type GuildCardView = {
  id: number
  name: string
  href: string
  focus: string
  initials: string
  logo: MediaView | null
  meta: string
}

export type GameCardView = {
  id: number
  title: string
  href: string
  synopsis: string
  status: DevelopmentStatus
  guildName: string | null
  platforms: string[]
  cover: MediaView | null
}

export type ArticleRowView = {
  id: number
  title: string
  url: string
  venue: string
  authors: string
  date: string
}

type Platform = NonNullable<Game['platforms']>[number]

const PLATFORM_LABELS: Record<Platform, string> = { pc: 'PC', web: 'Web', mobile: 'Mobile', console: 'Console' }

const countLines = (text: string | null | undefined): number =>
  (text ?? '').split('\n').filter((line) => line.trim()).length

export const toMediaView = (media: number | Media | null | undefined): MediaView | null =>
  typeof media === 'object' && media?.url ? { url: media.url, alt: media.alt } : null

export const toGuildCard = (guild: Guild, gameCount: number): GuildCardView => {
  const memberCount = countLines(guild.members)
  const meta = [pluralize(gameCount, 'jogo', 'jogos'), memberCount > 0 && pluralize(memberCount, 'membro', 'membros')]
    .filter(Boolean)
    .join('  ·  ')

  return {
    id: guild.id,
    name: guild.name,
    href: `/guildas/${guild.slug}`,
    focus: guild.shortDescription,
    initials: guild.name.slice(0, 2),
    logo: toMediaView(guild.logo),
    meta,
  }
}

export const toGameCard = (game: Game): GameCardView => ({
  id: game.id,
  title: game.title,
  href: `/jogos/${game.slug}`,
  synopsis: game.synopsis,
  status: game.developmentStatus,
  guildName: typeof game.guild === 'object' ? game.guild.name : null,
  platforms: (game.platforms ?? []).map((platform) => PLATFORM_LABELS[platform]),
  cover: toMediaView(game.cover),
})

export const toArticleRow = (article: Article): ArticleRowView => ({
  id: article.id,
  title: article.title,
  url: article.url ?? '',
  venue: article.venue,
  authors: article.authors.map((author) => author.name).join(', '),
  date: article.date,
})
