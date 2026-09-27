// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArrowLink } from '@/components/ui/ArrowLink'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LineBreaks } from '@/components/ui/LineBreaks'

describe('ButtonLink', () => {
  it('renders an internal link with the variant classes', () => {
    render(<ButtonLink href="/jogos">Ver jogos</ButtonLink>)

    const link = screen.getByRole('link', { name: 'Ver jogos' })
    expect(link).toHaveAttribute('href', '/jogos')
    expect(link).toHaveClass('bg-primary', 'type-button')
  })

  it('hides the decorative arrow from assistive technology', () => {
    render(
      <ButtonLink href="/jogos" variant="secondary" arrow>
        Ver jogos
      </ButtonLink>,
    )

    expect(screen.getByRole('link', { name: 'Ver jogos' })).toHaveClass('border-outline-strong')
    expect(screen.getByText('→')).toHaveAttribute('aria-hidden', 'true')
  })

  it('can open an external link in a new tab', () => {
    render(
      <ButtonLink href="https://itch.io" newTab arrow>
        Jogar
      </ButtonLink>,
    )
    const link = screen.getByRole('link', { name: 'Jogar' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('↗')).toHaveAttribute('aria-hidden', 'true')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses a plain anchor for mailto links', () => {
    render(
      <ButtonLink href="mailto:forja@exemplo.com" variant="onPrimary">
        Fale com a gente
      </ButtonLink>,
    )

    expect(screen.getByRole('link', { name: 'Fale com a gente' })).toHaveAttribute('href', 'mailto:forja@exemplo.com')
  })
})

describe('ArrowLink', () => {
  it('opens external links in a new tab safely', () => {
    render(
      <ArrowLink href="https://doi.org/10.1" external>
        Ler publicação
      </ArrowLink>,
    )

    const link = screen.getByRole('link', { name: 'Ler publicação (abre em nova aba)' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('↗')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Eyebrow', () => {
  it('uses the accessible red for small text by default', () => {
    render(<Eyebrow>01 / O que é a Forja</Eyebrow>)
    expect(screen.getByText('01 / O que é a Forja')).toHaveClass('type-label-mono', 'text-primary-text')
  })
})

describe('LineBreaks', () => {
  it('keeps words separated in the accessible name', () => {
    render(
      <h2>
        <LineBreaks text={'Uma iniciativa\nfeita por alunos.'} />
      </h2>,
    )

    expect(screen.getByRole('heading', { name: 'Uma iniciativa feita por alunos.' })).toBeInTheDocument()
  })
})
