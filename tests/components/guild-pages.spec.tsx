// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GuildProfile } from '@/components/guilds/GuildProfile'
import { GuildsIndex } from '@/components/guilds/GuildsIndex'
import { PreviewBanner } from '@/components/preview/PreviewBanner'
import type { GuildPageView } from '@/lib/presenters'

const guild: GuildPageView = {
  id: 1,
  name: 'Aurora',
  slug: 'aurora',
  href: '/guildas/aurora',
  shortDescription: 'Narrativa e jogos de exploração.',
  description: null,
  initials: 'Au',
  logo: null,
  cover: null,
  links: [{ label: 'itch.io', url: 'https://aurora.itch.io' }],
  members: ['Ana', 'Bruno'],
  games: [
    {
      id: 1,
      title: 'Ecos de Ferro',
      href: '/jogos/ecos-de-ferro',
      synopsis: 'Um metroidvania.',
      status: 'released',
      guildName: 'Aurora',
      platforms: ['PC'],
      cover: null,
    },
  ],
}

describe('GuildsIndex', () => {
  it('titles the page and links every guild', () => {
    render(
      <GuildsIndex
        guilds={[{ id: 1, name: 'Aurora', href: '/guildas/aurora', focus: 'x', initials: 'Au', logo: null, meta: '1 jogo' }]}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Todas as guildas.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aurora' })).toHaveAttribute('href', '/guildas/aurora')
  })

  it('shows an empty state when no guild is published', () => {
    render(<GuildsIndex guilds={[]} />)
    expect(screen.getByText('As guildas aparecem aqui assim que forem publicadas.')).toBeInTheDocument()
  })
})

describe('GuildProfile', () => {
  it('shows the guild identity, links, games and members', () => {
    render(<GuildProfile guild={guild} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Aurora' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Todas as guildas' })).toHaveAttribute('href', '/guildas')
    expect(screen.getByRole('link', { name: 'itch.io (abre em nova aba)' })).toHaveAttribute('href', 'https://aurora.itch.io')
    expect(screen.getByRole('link', { name: 'Ecos de Ferro' })).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(screen.getByRole('list', { name: 'Membros' })).toHaveTextContent('AnaBruno')
  })

  it('leaves out the sections the guild has not filled in', () => {
    render(<GuildProfile guild={{ ...guild, links: [], members: [], games: [], description: null }} />)

    expect(screen.queryByRole('heading', { name: 'Sobre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Membros' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Links da guilda' })).not.toBeInTheDocument()
    expect(screen.getByText('Esta guilda ainda não publicou jogos.')).toBeInTheDocument()
  })
})

describe('PreviewBanner', () => {
  it('explains the preview and offers a way out that does not prefetch', () => {
    render(<PreviewBanner />)

    expect(screen.getByText('Pré-visualização do rascunho')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sair da pré-visualização' })).toHaveAttribute('href', '/preview/exit')
  })
})
