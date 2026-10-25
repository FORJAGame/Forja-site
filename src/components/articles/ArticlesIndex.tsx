import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

import { ArticleList } from './ArticleList'

export function ArticlesIndex({ articles }: { articles: ArticleRowView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Pesquisa"
        title={'Artigos das\nguildas.'}
        description="Pesquisa publicada pelas guildas em revistas e eventos. Os links levam à publicação original."
      />
      <Container className="pb-section-mobile md:pb-section">
        {articles.length === 0 ? (
          <EmptyState>{landingCopy.articles.empty}</EmptyState>
        ) : (
          <ArticleList articles={articles} headingLevel="h2" />
        )}
      </Container>
    </>
  )
}
