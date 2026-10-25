// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card, CardLink } from '@/components/ui/Card'
import { ChipList } from '@/components/ui/ChipList'
import { Cover } from '@/components/ui/Cover'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('Card', () => {
  it('makes the whole card clickable through its title link', () => {
    render(
      <Card>
        <h3>
          <CardLink href="/jogos/ecos-de-ferro">Ecos de Ferro</CardLink>
        </h3>
      </Card>,
    )

    const link = screen.getByRole('link', { name: 'Ecos de Ferro' })
    expect(link).toHaveAttribute('href', '/jogos/ecos-de-ferro')
    expect(link).toHaveClass('after:absolute', 'after:inset-0')
    expect(screen.getByRole('article')).toHaveClass('border-outline')
  })
})

describe('Cover', () => {
  it('shows the uploaded image with its alt text', () => {
    render(<Cover image={{ url: '/api/media/file/capa.png', alt: 'Tela de título' }} ratio="video" sizes="100vw" />)
    expect(screen.getByRole('img', { name: 'Tela de título' })).toBeInTheDocument()
  })

  it('falls back to the spark placeholder when there is no image', () => {
    const { container } = render(<Cover image={null} ratio="video" sizes="100vw" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it.each([
    ['in-development', 'Em desenvolvimento', 'text-primary-text'],
    ['released', 'Lançado', 'text-on-surface'],
    ['paused', 'Pausado', 'text-on-surface-muted'],
  ] as const)('labels %s in Portuguese', (status, label, colorClass) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass(colorClass)
  })
})

describe('ChipList', () => {
  it('lists every item under an accessible label', () => {
    render(<ChipList label="Plataformas" items={['PC', 'Web']} />)

    const list = screen.getByRole('list', { name: 'Plataformas' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })
})

describe('GuildAvatar', () => {
  it('shows the initials when the guild has no logo', () => {
    render(<GuildAvatar initials="Tê" logo={null} />)

    expect(screen.getByText('Tê')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows the logo as decoration when there is one, since the name is next to it', () => {
    const { container } = render(<GuildAvatar initials="Au" logo={{ url: '/api/media/file/logo.png', alt: 'Logo' }} />)

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByText('Au')).not.toBeInTheDocument()
  })
})
