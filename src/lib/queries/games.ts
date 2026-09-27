import type { Payload } from 'payload'

import { type GameCardView, type GamePageView, toGameCard, toGamePage } from '@/lib/presenters'
import { PUBLIC_VIEWER, queryOptionsFor, type Viewer } from '@/lib/viewer'

const findGameBySlug = async (payload: Payload, slug: string, viewer: Viewer) => {
  const { docs } = await payload.find({
    collection: 'games',
    ...queryOptionsFor(viewer),
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export const listGames = async (payload: Payload): Promise<GameCardView[]> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    sort: '-publishedAt',
    pagination: false,
    depth: 1,
  })
  return docs.map(toGameCard)
}

export const getGamePage = async (
  payload: Payload,
  slug: string,
  viewer: Viewer = PUBLIC_VIEWER,
): Promise<GamePageView | null> => {
  const game =
    (await findGameBySlug(payload, slug, viewer)) ??
    (viewer.draft ? await findGameBySlug(payload, slug, PUBLIC_VIEWER) : null)
  return game ? toGamePage(game) : null
}

export const listGameSlugs = async (payload: Payload): Promise<string[]> => {
  const { docs } = await payload.find({
    collection: 'games',
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((game) => game.slug)
}
