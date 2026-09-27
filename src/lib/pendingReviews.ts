import type { Payload, Where } from 'payload'

export type PendingReview = {
  collection: 'guilds' | 'games'
  id: number
  title: string
  updatedAt: string
}

const latestVersionIsDraft: Where = { _status: { equals: 'draft' } }

export const listPendingReviews = async (payload: Payload): Promise<PendingReview[]> => {
  const query = { draft: true, where: latestVersionIsDraft, depth: 0, pagination: false, overrideAccess: true } as const
  const [guilds, games] = await Promise.all([
    payload.find({ collection: 'guilds', ...query }),
    payload.find({ collection: 'games', ...query }),
  ])

  return [
    ...guilds.docs.map((doc) => ({
      collection: 'guilds' as const,
      id: doc.id,
      title: doc.name,
      updatedAt: doc.updatedAt,
    })),
    ...games.docs.map((doc) => ({
      collection: 'games' as const,
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
    })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
