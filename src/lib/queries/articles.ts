import type { Payload } from 'payload'

import { type ArticleRowView, toArticleRow } from '@/lib/presenters'

export const listArticles = async (payload: Payload): Promise<ArticleRowView[]> => {
  const { docs } = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    sort: '-date',
    pagination: false,
    depth: 0,
  })
  return docs.map(toArticleRow)
}
