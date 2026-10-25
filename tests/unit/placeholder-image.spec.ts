import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { placeholderSvg, renderPlaceholderPng } from '@/seed/placeholderImage'

const palette = { background: '#16161A', stripe: '#3A0C0C', shard: '#D21312' }

describe('placeholder images', () => {
  it('renders a PNG of the requested size', async () => {
    const png = await renderPlaceholderPng(320, 180, palette, 0)
    const metadata = await sharp(png).metadata()

    expect(metadata).toMatchObject({ format: 'png', width: 320, height: 180 })
  })

  it('uses the brand palette', () => {
    const svg = placeholderSvg(320, 180, palette, 0)

    expect(svg).toContain('#16161A')
    expect(svg).toContain('#3A0C0C')
    expect(svg).toContain('#D21312')
  })

  it('varies the composition so seeded galleries do not repeat one image', () => {
    expect(placeholderSvg(320, 180, palette, 0)).not.toBe(placeholderSvg(320, 180, palette, 1))
  })
})
