import type { Payload } from 'payload'

import { type GuildCardView, type GuildPageView, toGameCard, toGuildCard, toGuildPage } from '@/lib/presenters'
import { PUBLIC_VIEWER, queryOptionsFor, type Viewer } from '@/lib/viewer'

import { countPublishedGamesByGuild } from './counts'

const findGuildBySlug = async (payload: Payload, slug: string, viewer: Viewer) => {
  const { docs } = await payload.find({
    collection: 'guilds',
    ...queryOptionsFor(viewer),
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

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
  const guild =
    (await findGuildBySlug(payload, slug, viewer)) ??
    (viewer.draft ? await findGuildBySlug(payload, slug, PUBLIC_VIEWER) : null)
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

export const listGuildSlugs = async (payload: Payload): Promise<string[]> => {
  const { docs } = await payload.find({
    collection: 'guilds',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((guild) => guild.slug)
}
