import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Articles } from './collections/Articles'
import { Games } from './collections/Games'
import { Guilds } from './collections/Guilds'
import { MAX_UPLOAD_BYTES, Media } from './collections/Media'
import { Users } from './collections/Users'
import { readServerEnv } from './config/env'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const env = readServerEnv()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeDashboard: ['@/components/admin/PendingReviews#PendingReviews'],
      graphics: {
        Logo: '@/components/admin/AdminGraphics#AdminLogo',
        Icon: '@/components/admin/AdminGraphics#AdminIcon',
      },
    },
    meta: {
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon.png' }],
    },
  },
  collections: [Users, Guilds, Games, Articles, Media],
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },
  }),
  editor: lexicalEditor(),
  graphQL: { disable: true },
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  plugins: [
    s3Storage({
      bucket: env.storage.bucket,
      collections: { media: true },
      // Keeps the media schema identical in every environment, so migrations match.
      alwaysInsertFields: true,
      config: {
        endpoint: env.storage.endpoint,
        region: env.storage.region,
        forcePathStyle: true,
        credentials: { accessKeyId: env.storage.accessKeyId, secretAccessKey: env.storage.secretAccessKey },
      },
    }),
  ],
  secret: env.payloadSecret,
  sharp,
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
