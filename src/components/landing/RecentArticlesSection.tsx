import { ArticleRow } from '@/components/articles/ArticleRow'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

export function RecentArticlesSection({ articles }: { articles: ArticleRowView[] }) {
  const copy = landingCopy.articles

  return (
    <Section id="artigos" labelledBy="artigos-title">
      <SectionHeader
        id="artigos-title"
        number="05"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/artigos', label: copy.link }}
      />
      {articles.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <RevealGroup as="ul" className="border-t border-outline">
          {articles.map((article) => (
            <RevealItem as="li" key={article.id}>
              <ArticleRow article={article} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
