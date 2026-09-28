import { describe, expect, it } from 'vitest'

import { confirmSeedTarget } from '@/seed/target'

const localDb = 'postgresql://postgres:postgres@127.0.0.1:5432/forja'
const remoteDb = 'postgresql://user:pass@ep-quiet-sky-123.sa-east-1.aws.neon.tech/forja?sslmode=require'

describe('confirmSeedTarget', () => {
  it('seeds the local database without asking', () => {
    expect(() => confirmSeedTarget({ DATABASE_URL: localDb })).not.toThrow()
  })

  it('refuses to wipe a remote database unless explicitly confirmed', () => {
    expect(() => confirmSeedTarget({ DATABASE_URL: remoteDb })).toThrow(/SEED_CONFIRM_REMOTE_WIPE=yes/)
    expect(() => confirmSeedTarget({ DATABASE_URL: remoteDb, SEED_CONFIRM_REMOTE_WIPE: 'true' })).toThrow()
    expect(() => confirmSeedTarget({ DATABASE_URL: remoteDb, SEED_CONFIRM_REMOTE_WIPE: 'yes' })).not.toThrow()
  })
})
