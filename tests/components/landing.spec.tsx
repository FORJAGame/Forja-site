// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AboutSection } from '@/components/landing/AboutSection'
import { FeaturedGamesSection } from '@/components/landing/FeaturedGamesSection'
import { GuildsSection } from '@/components/landing/GuildsSection'
import { Hero } from '@/components/landing/Hero'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { RecentArticlesSection } from '@/components/landing/RecentArticlesSection'
import { SupportSection } from '@/components/landing/SupportSection'
import { siteConfig } from '@/config/site'
import type { ArticleRowView, GameCardView, GuildCardView } from '@/lib/presenters'

const guild: GuildCardView = {
  id: 1,
  name: 'Aurora',
  href: '/guildas/aurora',
  focus: 'Narrativa e jogos de exploração.',
  initials: 'Au',
  logo: null,
  meta: '3 jogos',
}

const game: GameCardView = {
  id: 1,
  title: 'Ecos de Ferro',
  href: '/jogos/ecos-de-ferro',
  synopsis: 'Um metroidvania.',
  status: 'in-development',
  guildName: 'Aurora',
  platforms: ['PC', 'Web'],
  cover: null,
}

const article: ArticleRowView = {
  id: 1,
  title: 'Masmorras procedurais',
  url: 'https://doi.org/10.1/x',
  venue: 'SBGames 2026',
  authors: 'Ana Lima, Pedro Souza',
  date: '2026-09-01T00:00:00.000Z',
}

describe('Hero', () => {
  it('announces the Forja tagline as the page heading', () => {
    render(<Hero guildCount={8} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Onde jogos São forjados.' })).toBeInTheDocument()
  })

  it('shows the live guild count and both calls to action', () => {
    render(<Hero guildCount={8} />)

    expect(screen.getByText(/8 guildas/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entre para uma guilda' })).toHaveAttribute('href', '/#como-funciona')
    expect(screen.getByRole('link', { name: 'Ver jogos' })).toHaveAttribute('href', '/jogos')
  })
})

describe('AboutSection', () => {
  it('shows the published counts, including zero', () => {
    render(<AboutSection stats={{ guilds: 8, games: 0, articles: 3 }} />)

    const stats = screen.getByRole('list', { name: 'A Forja em números' })
    expect(stats).toHaveTextContent('8')
    expect(stats).toHaveTextContent('0')
    expect(stats).toHaveTextContent('3')
  })
})

describe('HowItWorksSection', () => {
  it('lists the three steps in order and flags the undefined selection process', () => {
    render(<HowItWorksSection />)

    const steps = screen.getByRole('list', { name: 'Etapas' })
    expect(steps.tagName).toBe('OL')
    expect(steps.querySelectorAll('li')).toHaveLength(3)
    expect(screen.getByText('Processo a definir')).toBeInTheDocument()
  })
})

describe('GuildsSection', () => {
  it('links each guild card to its page', () => {
    render(<GuildsSection guilds={[guild]} />)
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
    expect(screen.getByRole('link', { name: 'Ver todas as guildas' })).toHaveAttribute('href', '/guildas')
  })

  it('shows an empty state instead of an empty grid', () => {
    render(<GuildsSection guilds={[]} />)
    expect(screen.getByText('As guildas aparecem aqui assim que forem publicadas.')).toBeInTheDocument()
  })
})

describe('FeaturedGamesSection', () => {
  it('shows status, guild and platforms for each game', () => {
    render(<FeaturedGamesSection games={[game]} />)

    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Guilda e plataformas' })).toHaveTextContent('AuroraPCWeb')
  })

  it('shows an empty state when no game is published', () => {
    render(<FeaturedGamesSection games={[]} />)
    expect(screen.getByText('Os primeiros jogos estão sendo forjados. Volte em breve.')).toBeInTheDocument()
  })
})

describe('RecentArticlesSection', () => {
  it('links each article to the external publication in a new tab', () => {
    render(<RecentArticlesSection articles={[article]} />)

    const link = screen.getByRole('link', { name: 'Masmorras procedurais' })
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Ana Lima, Pedro Souza')).toBeInTheDocument()
  })

  it('shows an empty state when there are no articles', () => {
    render(<RecentArticlesSection articles={[]} />)
    expect(screen.getByText('Os artigos das guildas aparecem aqui quando forem publicados.')).toBeInTheDocument()
  })
})

describe('SupportSection', () => {
  it('points supporters to the contact e-mail', () => {
    render(<SupportSection />)
    expect(screen.getByRole('link', { name: 'Fale com a gente' })).toHaveAttribute('href', `mailto:${siteConfig.email}`)
  })
})
