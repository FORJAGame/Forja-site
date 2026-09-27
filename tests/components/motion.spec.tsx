// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CountUp } from '@/components/motion/CountUp'
import { Reveal } from '@/components/motion/Reveal'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <p>Conteúdo</p>
      </Reveal>,
    )
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})

describe('RevealGroup', () => {
  it('keeps list semantics for staggered lists', () => {
    render(
      <RevealGroup as="ul" label="Guildas">
        <RevealItem as="li">Aurora</RevealItem>
        <RevealItem as="li">Bigorna</RevealItem>
      </RevealGroup>,
    )

    const list = screen.getByRole('list', { name: 'Guildas' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })
})

describe('CountUp', () => {
  it('always exposes the final value to screen readers', () => {
    render(<CountUp value={30} />)

    expect(screen.getByText('30', { selector: '.sr-only' })).toBeInTheDocument()
  })
})
