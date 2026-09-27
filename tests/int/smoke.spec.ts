import config from '@payload-config'
import { getPayload } from 'payload'
import { describe, expect, it } from 'vitest'

describe('payload', () => {
  it('boots against the test database', async () => {
    const payload = await getPayload({ config })
    const { totalDocs } = await payload.count({ collection: 'users' })
    expect(totalDocs).toBeGreaterThanOrEqual(0)
  })
})
