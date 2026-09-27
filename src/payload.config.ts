import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Articles } from './collections/Articles'
import { Games } from './collections/Games'
import { Guilds } from './collections/Guilds'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeDashboard: ['@/components/admin/PendingReviews#PendingReviews'],
    },
  },
  collections: [Users, Guilds, Games, Articles, Media],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  editor: lexicalEditor(),
  graphQL: { disable: true },
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
