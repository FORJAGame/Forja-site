// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ArticleRow } from '@/components/landing/ArticleRow'
import { Hero } from '@/components/landing/Hero'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { ArrowLink } from '@/components/ui/ArrowLink'

const article = {
  id: 1,
  title: 'Masmorras procedurais',
  url: 'https://doi.org/10.1/x',
  venue: 'SBGames 2026',
  authors: 'Ana Lima',
  date: '2026-09-01T00:00:00.000Z',
}

describe('review polish', () => {
  it('uses the singular for a single published guild', () => {
    render(<Hero guildCount={1} />)
    expect(screen.getByText(/^1 guilda \|/)).toBeInTheDocument()
  })

  it('tells screen reader users that external links open a new tab', () => {
    render(
      <ArrowLink href="https://doi.org/10.1" external>
        Ler publicação
      </ArrowLink>,
    )
    expect(screen.getByRole('link', { name: 'Ler publicação (abre em nova aba)' })).toBeInTheDocument()
  })

  it('announces the new tab on article links too', () => {
    render(<ArticleRow article={article} />)
    expect(screen.getByRole('link', { name: 'Masmorras procedurais (abre em nova aba)' })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('renders an article without a link when it has no URL', () => {
    render(<ArticleRow article={{ ...article, url: null }} />)

    expect(screen.getByRole('heading', { name: 'Masmorras procedurais' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('Ler publicação')).not.toBeInTheDocument()
  })

  it('only points aria-controls at the menu while it exists', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    expect(screen.getByRole('button', { name: 'Abrir menu' })).not.toHaveAttribute('aria-controls')
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-controls', 'menu-mobile')
  })
})
