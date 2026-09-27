// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Hero } from '@/components/landing/Hero'
import { Reveal } from '@/components/motion/Reveal'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'

// Without JavaScript Motion never runs, so every element that starts hidden must be reachable by the
// `@media (scripting: none) [data-reveal]` CSS rule that forces it back to its final state.
const startsHidden = (element: Element) => {
  const style = (element as HTMLElement).style
  return style.opacity === '0' || /translate/.test(style.transform)
}

describe('content without JavaScript', () => {
  it('marks every initially hidden reveal element', () => {
    const { container } = render(
      <>
        <Reveal>
          <p>Seção</p>
        </Reveal>
        <RevealGroup as="ul">
          <RevealItem as="li">Item</RevealItem>
        </RevealGroup>
      </>,
    )

    const hidden = [...container.querySelectorAll('*')].filter(startsHidden)
    expect(hidden.length).toBeGreaterThan(0)
    for (const element of hidden) expect(element).toHaveAttribute('data-reveal')
  })

  it('marks every initially hidden part of the hero intro', () => {
    const { container } = render(<Hero guildCount={8} />)

    const hidden = [...container.querySelectorAll('*')].filter(startsHidden)
    expect(hidden.length).toBeGreaterThan(0)
    for (const element of hidden) expect(element).toHaveAttribute('data-reveal')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('marks layers that start visible and fade out, so they stay hidden without JavaScript', () => {
    const { container } = render(<Hero guildCount={8} />)

    const exitLayers = container.querySelectorAll('[data-reveal-exit]')
    expect(exitLayers.length).toBeGreaterThan(0)
    for (const layer of exitLayers) expect(layer).toHaveAttribute('aria-hidden', 'true')
  })
})
