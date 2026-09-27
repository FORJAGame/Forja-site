import { describe, expect, it } from 'vitest'

import { isPreviewCollection, previewAdminOptions, previewUrlFor, publicPathFor } from '@/lib/preview'

describe('preview URLs', () => {
  it('maps each collection to its public page', () => {
    expect(publicPathFor('guilds', 'aurora')).toBe('/guildas/aurora')
    expect(publicPathFor('games', 'ecos-de-ferro')).toBe('/jogos/ecos-de-ferro')
  })

  it('opens the preview route for saved documents only', () => {
    expect(previewUrlFor('games', 7)).toBe('/preview?collection=games&id=7')
    expect(previewUrlFor('games', undefined)).toBeNull()
  })

  it('accepts only the collections that have public pages', () => {
    expect(isPreviewCollection('guilds')).toBe(true)
    expect(isPreviewCollection('users')).toBe(false)
    expect(isPreviewCollection(null)).toBe(false)
  })

  it('wires the live preview iframe and the preview button to the same URL', async () => {
    const options = previewAdminOptions('guilds')
    const livePreviewUrl = options.livePreview.url as (args: { data: Record<string, unknown> }) => string | null

    expect(livePreviewUrl({ data: { id: 3 } })).toBe('/preview?collection=guilds&id=3')
    expect(livePreviewUrl({ data: {} })).toBeNull()
    expect(options.preview({ id: 3 }, {} as never)).toBe('/preview?collection=guilds&id=3')
    expect(options.livePreview.breakpoints?.map((breakpoint) => breakpoint.width)).toEqual([390, 1440])
  })
})
