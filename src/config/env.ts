export type StorageEnv = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export type ServerEnv = {
  databaseUrl: string
  pushDevSchema: boolean
  payloadSecret: string
  storage: StorageEnv
}

export const EXAMPLE_PAYLOAD_SECRET = 'troque-por-um-segredo-longo'

const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'PAYLOAD_SECRET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const

type RequiredVariable = (typeof REQUIRED_VARIABLES)[number]

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export const isLocalDatabase = (databaseUrl: string): boolean => {
  try {
    return LOCAL_HOSTS.has(new URL(databaseUrl).hostname)
  } catch {
    return false
  }
}

export const readServerEnv = (env: Record<string, string | undefined> = process.env): ServerEnv => {
  const read = (name: RequiredVariable) => env[name]?.trim() ?? ''

  const missing = REQUIRED_VARIABLES.filter((name) => !read(name))
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. See .env.example.`)
  }

  // The example secret is public in the repository; a deploy using it would accept forged sessions.
  if (read('PAYLOAD_SECRET') === EXAMPLE_PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET still has the example value. Generate one with `openssl rand -hex 32`.')
  }

  return {
    databaseUrl: read('DATABASE_URL'),
    // A dev push marks the database as push-managed, and every later `payload migrate` (the deploy build) stops on a prompt.
    pushDevSchema: isLocalDatabase(read('DATABASE_URL')),
    payloadSecret: read('PAYLOAD_SECRET'),
    storage: {
      endpoint: read('S3_ENDPOINT'),
      region: read('S3_REGION'),
      bucket: read('S3_BUCKET'),
      accessKeyId: read('S3_ACCESS_KEY_ID'),
      secretAccessKey: read('S3_SECRET_ACCESS_KEY'),
    },
  }
}
