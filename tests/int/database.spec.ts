import { describe, expect, it, vi } from 'vitest'

import { checkDatabaseConnection } from '@/config/database'

const testDatabaseUrl = () => {
  const url = process.env.DATABASE_URL_TEST
  if (!url) throw new Error('DATABASE_URL_TEST is not set')
  return url
}

const withPath = (databaseUrl: string, change: (url: URL) => void) => {
  const url = new URL(databaseUrl)
  change(url)
  return url.toString()
}

describe('checkDatabaseConnection', () => {
  it('resolves when the database answers', async () => {
    await expect(checkDatabaseConnection(testDatabaseUrl(), { attempts: 1, delayMs: 0 })).resolves.toBeUndefined()
  })

  it('retries a database that is not listening and then gives up with a clear message', async () => {
    const closedPort = withPath(testDatabaseUrl(), (url) => (url.port = '1'))
    const onRetry = vi.fn()

    await expect(checkDatabaseConnection(closedPort, { attempts: 2, delayMs: 10, onRetry })).rejects.toThrow(
      /^Nothing is accepting connections at 127\.0\.0\.1:1\/forja_test\. .* \(gave up after 2 attempts\)$/,
    )
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not retry when the server answers with an error', async () => {
    const missingDatabase = withPath(testDatabaseUrl(), (url) => (url.pathname = '/forja_does_not_exist'))
    const onRetry = vi.fn()

    await expect(checkDatabaseConnection(missingDatabase, { attempts: 3, delayMs: 10, onRetry })).rejects.toThrow(
      'The database 127.0.0.1:5432/forja_does_not_exist does not exist. Create it or fix its name in DATABASE_URL.',
    )
    expect(onRetry).not.toHaveBeenCalled()
  })
})
