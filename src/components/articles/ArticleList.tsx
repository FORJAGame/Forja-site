import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import type { ArticleRowView } from '@/lib/presenters'

import { ArticleRow } from './ArticleRow'

type ArticleListProps = { articles: ArticleRowView[]; headingLevel?: 'h2' | 'h3' }

export function ArticleList({ articles, headingLevel }: ArticleListProps) {
  return (
    <RevealGroup as="ul" className="border-t border-outline">
      {articles.map((article) => (
        <RevealItem as="li" key={article.id}>
          <ArticleRow article={article} headingLevel={headingLevel} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
