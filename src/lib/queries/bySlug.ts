import type { Payload } from 'payload'

import type { PageCollection } from '@/lib/paths'
import { PUBLIC_VIEWER, queryOptionsFor, type Viewer } from '@/lib/viewer'

const findBySlug = async <TCollection extends PageCollection>(
  payload: Payload,
  collection: TCollection,
  slug: string,
  viewer: Viewer,
) => {
  const { docs } = await payload.find({
    collection,
    ...queryOptionsFor(viewer),
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export const findPageBySlug = async <TCollection extends PageCollection>(
  payload: Payload,
  collection: TCollection,
  slug: string,
  viewer: Viewer,
) =>
  (await findBySlug(payload, collection, slug, viewer)) ??
  (viewer.draft ? await findBySlug(payload, collection, slug, PUBLIC_VIEWER) : null)

export const listPublishedSlugs = async (payload: Payload, collection: PageCollection): Promise<string[]> => {
  const { docs } = await payload.find({
    collection,
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug)
}
