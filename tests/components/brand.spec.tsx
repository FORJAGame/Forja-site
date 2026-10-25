// @vitest-environment jsdom
import '../helpers/dom'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { Logo } from '@/components/brand/Logo'
import { SHARD_POLYGONS, Shards } from '@/components/brand/Shards'

describe('brand', () => {
  it('renders the logo with an accessible name', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'Forja' })).toBeInTheDocument()
  })

  it('draws the three sparks from the logo as decoration only', () => {
    const { container } = render(<Shards className="text-primary" />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 272 283')
    expect(container.querySelectorAll('polygon')).toHaveLength(SHARD_POLYGONS.length)
  })

  it('keeps the diagonal bands out of the accessibility tree', () => {
    const { container } = render(<DiagonalBands tone="ink" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
