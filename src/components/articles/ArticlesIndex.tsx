import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

import { ArticleRow } from './ArticleRow'

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
          <RevealGroup as="ul" className="border-t border-outline">
            {articles.map((article) => (
              <RevealItem as="li" key={article.id}>
                <ArticleRow article={article} headingLevel="h2" />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Container>
    </>
  )
}
