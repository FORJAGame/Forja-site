import { Arrow } from '@/components/ui/Arrow'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

type ArticleRowProps = { article: ArticleRowView; headingLevel?: 'h2' | 'h3' }

export function ArticleRow({ article, headingLevel: Heading = 'h3' }: ArticleRowProps) {
  return (
    <article className="group relative flex flex-col gap-sm border-b border-outline py-lg md:flex-row md:items-center md:gap-2xl md:py-xl">
      <p className="type-label-mono min-w-0 break-words text-primary-text md:w-[220px] md:shrink-0">
        {article.venue}
      </p>
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <Heading className="type-headline-sm break-words md:type-title-list">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0"
            >
              {article.title} <span className="sr-only">(abre em nova aba)</span>
            </a>
          ) : (
            article.title
          )}
        </Heading>
        <p className="type-body-sm text-on-surface-muted">{article.authors}</p>
      </div>
      {article.url && (
        <span
          aria-hidden="true"
          className="type-button inline-flex items-center gap-sm md:shrink-0"
        >
          {landingCopy.articles.readLabel}
          <Arrow external />
        </span>
      )}
    </article>
  )
}
