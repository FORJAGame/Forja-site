// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArticlesIndex } from '@/components/articles/ArticlesIndex'
import { GameDetail } from '@/components/games/GameDetail'
import { GamesIndex } from '@/components/games/GamesIndex'
import type { GamePageView } from '@/lib/presenters'

const game: GamePageView = {
  id: 1,
  title: 'Ecos de Ferro',
  slug: 'ecos-de-ferro',
  href: '/jogos/ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  status: 'released',
  guildName: 'Aurora',
  platforms: ['PC', 'Web'],
  cover: null,
  guild: { name: 'Aurora', href: '/guildas/aurora' },
  trailerVideoId: 'dQw4w9WgXcQ',
  description: null,
  gallery: [{ url: '/api/media/file/a.png', alt: 'Tela 1' }],
  playUrl: 'https://aurora.itch.io/ecos',
  credits: 'Ana — arte\nBruno — código',
  releaseDate: 'setembro de 2026',
}

describe('GamesIndex', () => {
  it('titles the page and links every game', () => {
    render(<GamesIndex games={[game]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Feito nas guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
  })
})

describe('GameDetail', () => {
  it('shows the game with its guild, play link, trailer, gallery and credits', () => {
    render(<GameDetail game={game} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Ecos de Ferro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Todos os jogos' })).toHaveAttribute('href', '/jogos')
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
    const play = screen.getByRole('link', { name: 'Jogar (abre em nova aba)' })
    expect(play).toHaveAttribute('href', 'https://aurora.itch.io/ecos')
    expect(play).toHaveAttribute('target', '_blank')
    expect(screen.getByTitle('Trailer de Ecos de Ferro')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tela 1' })).toBeInTheDocument()
    expect(screen.getByText(/Bruno — código/)).toBeInTheDocument()
    expect(screen.getByText('setembro de 2026')).toBeInTheDocument()
  })

  it('leaves out the sections the game does not have', () => {
    render(
      <GameDetail
        game={{ ...game, trailerVideoId: null, gallery: [], credits: null, playUrl: null, releaseDate: null, description: null }}
      />,
    )

    for (const title of ['Trailer', 'Sobre o jogo', 'Galeria', 'Créditos']) {
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: /Jogar/ })).not.toBeInTheDocument()
  })
})

describe('ArticlesIndex', () => {
  it('lists the articles, or explains that there are none yet', () => {
    const { rerender } = render(
      <ArticlesIndex
        articles={[{ id: 1, title: 'Masmorras', url: 'https://doi.org/1', venue: 'SBGames', authors: 'Ana', date: '2026-01-01' }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Artigos das guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Masmorras (abre em nova aba)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masmorras (abre em nova aba)' })).toBeInTheDocument()

    rerender(<ArticlesIndex articles={[]} />)
    expect(screen.getByText('Os artigos das guildas aparecem aqui quando forem publicados.')).toBeInTheDocument()
  })
})
