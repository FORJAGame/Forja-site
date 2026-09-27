import type { Article, Game, Guild, Media } from '@/payload-types'
import { formatMonthYear } from '@/utilities/date'
import { pluralize } from '@/utilities/pluralize'
import { getYouTubeVideoId } from '@/utilities/url'

import type { DevelopmentStatus, ExternalLinkView, MediaView, RichTextData } from './views'

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
  url: string | null
  venue: string
  authors: string
  date: string
}

type Platform = NonNullable<Game['platforms']>[number]

const PLATFORM_LABELS: Record<Platform, string> = { pc: 'PC', web: 'Web', mobile: 'Mobile', console: 'Console' }

const toLines = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

// Payload's generated rich text type is the same serialized Lexical state the renderer expects.
const toRichText = (value: unknown): RichTextData | null => (value ? (value as RichTextData) : null)

export const toMediaView = (media: number | Media | null | undefined): MediaView | null =>
  typeof media === 'object' && media?.url ? { url: media.url, alt: media.alt } : null

export const toGuildCard = (guild: Guild, gameCount: number): GuildCardView => {
  const memberCount = toLines(guild.members).length
  const meta = [pluralize(gameCount, 'jogo', 'jogos'), memberCount > 0 && pluralize(memberCount, 'membro', 'membros')]
    .filter(Boolean)
    .join('  ·  ')

  return {
    id: guild.id,
    name: guild.name,
    href: `/guildas/${guild.slug}`,
    focus: guild.shortDescription,
    initials: Array.from(guild.name).slice(0, 2).join(''),
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
  url: article.url ?? null,
  venue: article.venue,
  authors: article.authors.map((author) => author.name).join(', '),
  date: article.date,
})

export type GuildPageView = {
  id: number
  name: string
  slug: string
  href: string
  shortDescription: string
  description: RichTextData | null
  initials: string
  logo: MediaView | null
  cover: MediaView | null
  links: ExternalLinkView[]
  members: string[]
  games: GameCardView[]
}

type GuildLinkPlatform = NonNullable<Guild['links']>[number]['platform']

const GUILD_LINK_LABELS: Record<GuildLinkPlatform, string> = {
  instagram: 'Instagram',
  itch: 'itch.io',
  linkedin: 'LinkedIn',
  website: 'Site',
  other: 'Link',
}

export const toGuildPage = (guild: Guild, games: GameCardView[]): GuildPageView => {
  const card = toGuildCard(guild, games.length)
  return {
    id: guild.id,
    name: guild.name,
    slug: guild.slug,
    href: card.href,
    shortDescription: guild.shortDescription,
    description: toRichText(guild.description),
    initials: card.initials,
    logo: card.logo,
    cover: toMediaView(guild.cover),
    links: (guild.links ?? [])
      .filter((link) => link.url)
      .map((link) => ({ label: GUILD_LINK_LABELS[link.platform], url: link.url as string })),
    members: toLines(guild.members),
    games,
  }
}

export type GamePageView = GameCardView & {
  slug: string
  guild: { name: string; href: string } | null
  trailerVideoId: string | null
  description: RichTextData | null
  gallery: MediaView[]
  playUrl: string | null
  credits: string | null
  releaseDate: string | null
}

export const toGamePage = (game: Game): GamePageView => ({
  ...toGameCard(game),
  slug: game.slug,
  guild: typeof game.guild === 'object' ? { name: game.guild.name, href: `/guildas/${game.guild.slug}` } : null,
  trailerVideoId: game.trailerUrl ? getYouTubeVideoId(game.trailerUrl) : null,
  description: toRichText(game.description),
  gallery: (game.gallery ?? []).map(toMediaView).filter((image): image is MediaView => image !== null),
  playUrl: game.playUrl || null,
  credits: game.credits?.trim() || null,
  releaseDate: game.releaseDate ? formatMonthYear(game.releaseDate) : null,
})
