export type PageCollection = 'guilds' | 'games'

const PUBLIC_PATH_PREFIX: Record<PageCollection, string> = { guilds: '/guildas', games: '/jogos' }

export const publicPathFor = (collection: PageCollection, slug: string): string =>
  `${PUBLIC_PATH_PREFIX[collection]}/${slug}`
