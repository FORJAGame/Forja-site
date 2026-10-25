import type { GeneratePreviewURL, LivePreviewConfig } from 'payload'

import type { PageCollection } from './paths'

// DESIGN.md › Layout: the same widths the landing was designed and verified at.
const PREVIEW_BREAKPOINTS: NonNullable<LivePreviewConfig['breakpoints']> = [
  { name: 'mobile', label: 'Celular', width: 390, height: 844 },
  { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
]

export const isPreviewCollection = (value: string | null): value is PageCollection =>
  value === 'guilds' || value === 'games'

export const previewUrlFor = (collection: PageCollection, id: unknown): string | null =>
  id ? `/preview?${new URLSearchParams({ collection, id: String(id) })}` : null

export const previewAdminOptions = (collection: PageCollection) => {
  const livePreview: LivePreviewConfig = {
    url: ({ data }) => previewUrlFor(collection, data?.id),
    breakpoints: PREVIEW_BREAKPOINTS,
  }
  const preview: GeneratePreviewURL = (doc) => previewUrlFor(collection, doc.id)
  return { livePreview, preview }
}
