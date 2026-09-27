import { Arrow } from '@/components/ui/Arrow'
import { landingCopy } from '@/content/landing'
import type { ArticleRowView } from '@/lib/presenters'

export function ArticleRow({ article }: { article: ArticleRowView }) {
  return (
    <article className="group relative flex flex-col gap-sm border-b border-outline py-lg md:flex-row md:items-center md:gap-2xl md:py-xl">
      <p className="type-label-mono text-primary-text md:w-[220px] md:shrink-0">{article.venue}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <h3 className="type-headline-sm break-words md:type-title-list">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
            {article.title}
          </a>
        </h3>
        <p className="type-body-sm text-on-surface-muted">{article.authors}</p>
      </div>
      <span aria-hidden="true" className="type-button inline-flex items-center gap-sm md:shrink-0">
        {landingCopy.articles.readLabel}
        <Arrow external />
      </span>
    </article>
  )
}
