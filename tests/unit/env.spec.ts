import { describe, expect, it } from 'vitest'

import { EXAMPLE_PAYLOAD_SECRET, readServerEnv } from '@/config/env'

const completeEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/forja',
  PAYLOAD_SECRET: 'a'.repeat(64),
  S3_ENDPOINT: 'http://127.0.0.1:8333',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'forja-media',
  S3_ACCESS_KEY_ID: 'forja',
  S3_SECRET_ACCESS_KEY: 'forja-dev-secret',
}

describe('readServerEnv', () => {
  it('reads the database, secret and storage settings', () => {
    expect(readServerEnv(completeEnv)).toEqual({
      databaseUrl: completeEnv.DATABASE_URL,
      payloadSecret: completeEnv.PAYLOAD_SECRET,
      storage: {
        endpoint: 'http://127.0.0.1:8333',
        region: 'us-east-1',
        bucket: 'forja-media',
        accessKeyId: 'forja',
        secretAccessKey: 'forja-dev-secret',
      },
    })
  })

  it('names every missing or blank variable at once', () => {
    const env = { ...completeEnv, S3_BUCKET: '  ', S3_ENDPOINT: undefined, PAYLOAD_SECRET: '' }
    expect(() => readServerEnv(env)).toThrow(
      'Missing environment variables: PAYLOAD_SECRET, S3_ENDPOINT, S3_BUCKET. See .env.example.',
    )
  })

  it('refuses the placeholder secret from .env.example, which would let anyone forge sessions', () => {
    expect(() => readServerEnv({ ...completeEnv, PAYLOAD_SECRET: EXAMPLE_PAYLOAD_SECRET })).toThrow(
      /PAYLOAD_SECRET still has the example value/,
    )
  })

  it('trims surrounding whitespace pasted into dashboards', () => {
    expect(readServerEnv({ ...completeEnv, S3_BUCKET: ' forja-media-dev \n' }).storage.bucket).toBe('forja-media-dev')
  })
})
