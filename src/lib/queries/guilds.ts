import type { Payload } from 'payload'

import { type GuildCardView, type GuildPageView, toGameCard, toGuildCard, toGuildPage } from '@/lib/presenters'
import { PUBLIC_VIEWER, type Viewer } from '@/lib/viewer'

import { findPageBySlug, listPublishedSlugs } from './bySlug'
import { countPublishedGamesByGuild } from './counts'

export const listGuilds = async (payload: Payload): Promise<GuildCardView[]> => {
  const [guilds, gamesByGuild] = await Promise.all([
    payload.find({ collection: 'guilds', overrideAccess: false, sort: 'name', pagination: false, depth: 1 }),
    countPublishedGamesByGuild(payload),
  ])
  return guilds.docs.map((guild) => toGuildCard(guild, gamesByGuild.get(guild.id) ?? 0))
}

export const getGuildPage = async (
  payload: Payload,
  slug: string,
  viewer: Viewer = PUBLIC_VIEWER,
): Promise<GuildPageView | null> => {
  const guild = await findPageBySlug(payload, 'guilds', slug, viewer)
  if (!guild) return null

  const games = await payload.find({
    collection: 'games',
    overrideAccess: false,
    where: { guild: { equals: guild.id } },
    sort: '-publishedAt',
    pagination: false,
    depth: 1,
  })
  return toGuildPage(guild, games.docs.map(toGameCard))
}

export const listGuildSlugs = (payload: Payload): Promise<string[]> => listPublishedSlugs(payload, 'guilds')
