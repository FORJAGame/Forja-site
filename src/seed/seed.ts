import { readFileSync } from 'node:fs'

import type { Payload } from 'payload'

import { slugify } from '@/utilities/slugify'

import { LOCAL_SEED_ADMIN, type SeedAdmin } from './admin'
import { articles, games, guilds } from './data'
import { renderPlaceholderPng, type PlaceholderPalette } from './placeholderImage'

// The seed runs outside Next.js, where revalidatePath would throw. Each call needs its own context:
// Payload's storage adapter writes flags into it, and a shared one makes later uploads skip storage.
const trustedScript = () => ({ overrideAccess: true, context: { disableRevalidate: true } }) as const

const COLLECTIONS_IN_DELETE_ORDER = ['games', 'articles', 'users', 'guilds', 'media'] as const

const COVER = { width: 1600, height: 900 }
const GALLERY_SIZE = 3

const readColorToken = (css: string, name: string): string => {
  const match = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`src/styles/tokens.css has no --color-${name}`)
  return match[1].trim()
}

const brandPalette = (): PlaceholderPalette => {
  const css = readFileSync('src/styles/tokens.css', 'utf8')
  return {
    background: readColorToken(css, 'surface-raised'),
    stripe: readColorToken(css, 'ember'),
    shard: readColorToken(css, 'primary'),
  }
}

export const seed = async (payload: Payload, admin: SeedAdmin = LOCAL_SEED_ADMIN): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed wipes content and must never run in production.')
  }

  for (const collection of COLLECTIONS_IN_DELETE_ORDER) {
    await payload.delete({ collection, where: { id: { exists: true } }, ...trustedScript() })
  }

  await payload.create({ collection: 'users', data: { ...admin, role: 'admin' }, ...trustedScript() })

  const palette = brandPalette()
  let variant = 0
  const uploadPlaceholder = async (alt: string, name: string): Promise<number> => {
    const data = await renderPlaceholderPng(COVER.width, COVER.height, palette, variant++)
    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
      ...trustedScript(),
    })
    return media.id
  }

  const guildIdByName = new Map<string, number>()
  for (const guild of guilds) {
    const created = await payload.create({
      collection: 'guilds',
      data: { ...guild, slug: slugify(guild.name), _status: 'published' },
      ...trustedScript(),
    })
    guildIdByName.set(guild.name, created.id)
  }

  const guildId = (name: string): number => {
    const id = guildIdByName.get(name)
    if (id === undefined) throw new Error(`Seed references unknown guild "${name}"`)
    return id
  }

  for (const [index, { guildName, ...game }] of games.entries()) {
    const slug = slugify(game.title)
    const cover = await uploadPlaceholder(`Capa provisória de ${game.title}`, `${slug}-capa`)
    const gallery =
      index === 0
        ? await Promise.all(
            Array.from({ length: GALLERY_SIZE }, (_, shot) =>
              uploadPlaceholder(`Imagem provisória ${shot + 1} de ${game.title}`, `${slug}-galeria-${shot + 1}`),
            ),
          )
        : []

    await payload.create({
      collection: 'games',
      data: { ...game, slug, cover, gallery, guild: guildId(guildName), _status: 'published' },
      ...trustedScript(),
    })
  }

  for (const { guildName, ...article } of articles) {
    await payload.create({
      collection: 'articles',
      data: { ...article, guild: guildName ? guildId(guildName) : null },
      ...trustedScript(),
    })
  }
}
