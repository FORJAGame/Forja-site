import type { GeneratePreviewURL, LivePreviewConfig } from 'payload'

export type PreviewCollection = 'guilds' | 'games'

const PUBLIC_PATH_PREFIX: Record<PreviewCollection, string> = { guilds: '/guildas', games: '/jogos' }

// DESIGN.md › Layout: the same widths the landing was designed and verified at.
const PREVIEW_BREAKPOINTS: NonNullable<LivePreviewConfig['breakpoints']> = [
  { name: 'mobile', label: 'Celular', width: 390, height: 844 },
  { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
]

export const isPreviewCollection = (value: string | null): value is PreviewCollection =>
  value === 'guilds' || value === 'games'

export const publicPathFor = (collection: PreviewCollection, slug: string): string =>
  `${PUBLIC_PATH_PREFIX[collection]}/${slug}`

export const previewUrlFor = (collection: PreviewCollection, id: unknown): string | null =>
  id ? `/preview?${new URLSearchParams({ collection, id: String(id) })}` : null

export const previewAdminOptions = (collection: PreviewCollection) => {
  const livePreview: LivePreviewConfig = {
    url: ({ data }) => previewUrlFor(collection, data?.id),
    breakpoints: PREVIEW_BREAKPOINTS,
  }
  const preview: GeneratePreviewURL = (doc) => previewUrlFor(collection, doc.id)
  return { livePreview, preview }
}
