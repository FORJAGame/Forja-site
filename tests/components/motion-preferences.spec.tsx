// @vitest-environment jsdom
import { mockVisibleIntersections } from '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { animate } from 'motion/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CountUp } from '@/components/motion/CountUp'
import { Parallax } from '@/components/motion/Parallax'

const preferences = vi.hoisted(() => ({ reduceMotion: false }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    useReducedMotion: () => preferences.reduceMotion,
    animate: vi.fn(() => ({ stop: () => {} })),
    useTransform: (_value: unknown, _input: number[], output: number[]) => actual.motionValue(output[1]),
  }
})

beforeEach(() => {
  vi.mocked(animate).mockClear()
  mockVisibleIntersections()
})

describe('CountUp', () => {
  it('counts up from zero once it is visible', () => {
    preferences.reduceMotion = false
    render(<CountUp value={30} />)

    expect(animate).toHaveBeenCalledWith(0, 30, expect.objectContaining({ duration: expect.any(Number) }))
  })

  it('shows the final number without counting when motion is reduced', () => {
    preferences.reduceMotion = true
    render(<CountUp value={30} />)

    expect(animate).not.toHaveBeenCalled()
    expect(screen.getByText('30', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
  })
})

describe('Parallax', () => {
  it('follows the scroll', () => {
    preferences.reduceMotion = false
    render(
      <Parallax distance={40}>
        <span>Fagulhas</span>
      </Parallax>,
    )

    expect(screen.getByText('Fagulhas').parentElement?.style.transform).toContain('translateY(40px)')
  })

  it('stays still when motion is reduced', () => {
    preferences.reduceMotion = true
    render(
      <Parallax distance={40}>
        <span>Fagulhas</span>
      </Parallax>,
    )

    expect(screen.getByText('Fagulhas').parentElement?.style.transform ?? '').not.toContain('translateY(40px)')
  })

  // The server cannot know the visitor's preference, so the markup must not depend on it (hydration).
  it('renders the same element attributes whatever the preference', () => {
    const renderStyleAttribute = (reduceMotion: boolean) => {
      preferences.reduceMotion = reduceMotion
      const { container, unmount } = render(
        <Parallax distance={40}>
          <span>Fagulhas</span>
        </Parallax>,
      )
      const hasStyle = container.firstElementChild?.hasAttribute('style')
      unmount()
      return hasStyle
    }

    expect(renderStyleAttribute(true)).toBe(renderStyleAttribute(false))
  })
})
