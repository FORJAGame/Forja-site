import type { Payload } from 'payload'

import { type GameCardView, type GamePageView, toGameCard, toGamePage } from '@/lib/presenters'
import { PUBLIC_VIEWER, type Viewer } from '@/lib/viewer'

import { findPageBySlug, listPublishedSlugs } from './bySlug'

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
  const game = await findPageBySlug(payload, 'games', slug, viewer)
  return game ? toGamePage(game) : null
}

export const listGameSlugs = (payload: Payload): Promise<string[]> => listPublishedSlugs(payload, 'games')
