import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { ArticlesIndex } from '@/components/articles/ArticlesIndex'
import { listArticles } from '@/lib/queries/articles'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Artigos',
  description: 'Pesquisa publicada pelas guildas da Forja.',
}

export default async function ArticlesPage() {
  const payload = await getPayload({ config })
  return <ArticlesIndex articles={await listArticles(payload)} />
}
