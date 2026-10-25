import pg from 'pg'

export type DatabaseCheckOptions = {
  attempts: number
  delayMs: number
  onRetry?: (message: string, attempt: number) => void
}

const CONNECTION_TIMEOUT_MS = 5_000

export const describeDatabaseTarget = (databaseUrl: string): string => {
  try {
    const url = new URL(databaseUrl)
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`
  } catch {
    return 'DATABASE_URL (not a valid URL)'
  }
}

const errorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))

export const explainDatabaseError = (error: unknown, target: string): string => {
  switch (errorCode(error)) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return `Database host not found (${target}). Check the host in DATABASE_URL.`
    case 'ECONNREFUSED':
      return `Nothing is accepting connections at ${target}. Check that Postgres is running and that DATABASE_URL points to it.`
    case '28P01':
      return `The database at ${target} rejected the user or password in DATABASE_URL.`
    case '3D000':
      return `The database ${target} does not exist. Create it or fix its name in DATABASE_URL.`
    default:
      return `Could not connect to the database at ${target}: ${errorMessage(error)}`
  }
}

// A server that answered (wrong password, missing database) will answer the same way again; only network failures are worth retrying.
const isWorthRetrying = (error: unknown): boolean => !(error instanceof pg.DatabaseError)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const connectOnce = async (databaseUrl: string): Promise<void> => {
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: CONNECTION_TIMEOUT_MS })
  try {
    await client.connect()
    await client.query('SELECT 1')
  } finally {
    await client.end().catch(() => undefined)
  }
}

// The database may still be starting when the app boots (e.g. both started by the same compose file), so connection failures retry.
export const checkDatabaseConnection = async (databaseUrl: string, options: DatabaseCheckOptions): Promise<void> => {
  const target = describeDatabaseTarget(databaseUrl)

  for (let attempt = 1; ; attempt++) {
    try {
      await connectOnce(databaseUrl)
      return
    } catch (error) {
      const message = explainDatabaseError(error, target)
      if (attempt >= options.attempts || !isWorthRetrying(error)) {
        throw new Error(attempt > 1 ? `${message} (gave up after ${attempt} attempts)` : message)
      }
      options.onRetry?.(message, attempt)
      await wait(options.delayMs)
    }
  }
}
