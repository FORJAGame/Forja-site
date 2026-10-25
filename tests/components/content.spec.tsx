// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RichTextContent } from '@/components/content/RichTextContent'
import { BackLink } from '@/components/ui/BackLink'
import { Gallery } from '@/components/ui/Gallery'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed'
import type { RichTextData } from '@/lib/views'

const text = (value: string) => ({ type: 'text', text: value, version: 1, detail: 0, format: 0, mode: 'normal', style: '' })

const richText = {
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      { type: 'heading', tag: 'h2', version: 1, direction: 'ltr', format: '', indent: 0, children: [text('Mecânicas')] },
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [text('Forje peças para abrir caminhos.')],
      },
    ],
  },
} as unknown as RichTextData

describe('PageHeader', () => {
  it('renders the page title as the only h1', () => {
    render(<PageHeader eyebrow="Guildas" title={'Todas as\nguildas.'} description="Times de alunos." />)

    expect(screen.getByRole('heading', { level: 1, name: 'Todas as guildas.' })).toBeInTheDocument()
    expect(screen.getByText('Times de alunos.')).toBeInTheDocument()
  })
})

describe('SectionHeader', () => {
  it('works without a section number on internal pages', () => {
    render(<SectionHeader id="x" eyebrow="Guildas" title="Todas" />)
    expect(screen.getByText('Guildas')).toBeInTheDocument()
  })
})

describe('BackLink', () => {
  it('links back with a decorative arrow', () => {
    render(<BackLink href="/guildas">Todas as guildas</BackLink>)

    expect(screen.getByRole('link', { name: 'Todas as guildas' })).toHaveAttribute('href', '/guildas')
    expect(screen.getByText('←')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('YouTubeEmbed', () => {
  it('embeds the privacy-enhanced player lazily with an accessible title', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Trailer de Ecos de Ferro" />)

    const frame = screen.getByTitle('Trailer de Ecos de Ferro')
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(frame).toHaveAttribute('loading', 'lazy')
  })
})

describe('Gallery', () => {
  it('shows every image with its alt text', () => {
    render(
      <Gallery
        images={[
          { url: '/api/media/file/a.png', alt: 'Tela 1' },
          { url: '/api/media/file/b.png', alt: 'Tela 2' },
        ]}
      />,
    )

    expect(screen.getByRole('img', { name: 'Tela 1' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tela 2' })).toBeInTheDocument()
  })
})

describe('RichTextContent', () => {
  it('renders the Lexical headings and paragraphs', () => {
    render(<RichTextContent data={richText} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mecânicas' })).toBeInTheDocument()
    expect(screen.getByText('Forje peças para abrir caminhos.')).toBeInTheDocument()
  })
})
