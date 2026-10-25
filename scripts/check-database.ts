// Runs before migrations when the container starts, so a missing or unreachable database fails with a clear message.
import { checkDatabaseConnection } from '../src/config/database.ts'
import { readServerEnv } from '../src/config/env.ts'

try {
  const { databaseUrl } = readServerEnv()
  await checkDatabaseConnection(databaseUrl, {
    attempts: 10,
    delayMs: 3_000,
    onRetry: (message, attempt) => console.warn(`[check-database] attempt ${attempt} failed: ${message} Retrying…`),
  })
  console.log('[check-database] database is reachable')
} catch (error) {
  console.error(`[check-database] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
