import { describe, expect, it } from 'vitest'

import { LOCAL_SEED_ADMIN, isLocalDatabase, resolveSeedAdmin } from '@/seed/admin'

const localDb = 'postgresql://postgres:postgres@127.0.0.1:5432/forja'
const remoteDb = 'postgresql://user:pass@ep-quiet-sky-123.sa-east-1.aws.neon.tech/forja?sslmode=require'

describe('isLocalDatabase', () => {
  it('recognizes the docker-compose database', () => {
    expect(isLocalDatabase(localDb)).toBe(true)
    expect(isLocalDatabase('postgresql://postgres:postgres@localhost:5432/forja')).toBe(true)
  })

  it('treats anything else, or an invalid URL, as remote', () => {
    expect(isLocalDatabase(remoteDb)).toBe(false)
    expect(isLocalDatabase('not a url')).toBe(false)
  })
})

describe('resolveSeedAdmin', () => {
  it('uses the public local login only against the local database', () => {
    expect(resolveSeedAdmin({ DATABASE_URL: localDb })).toBe(LOCAL_SEED_ADMIN)
  })

  it('refuses to create the public local login in a remote database', () => {
    expect(() => resolveSeedAdmin({ DATABASE_URL: remoteDb })).toThrow(/SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/)
  })

  it('uses the admin given through the environment', () => {
    const admin = resolveSeedAdmin({
      DATABASE_URL: remoteDb,
      SEED_ADMIN_EMAIL: ' prof@cesar.school ',
      SEED_ADMIN_PASSWORD: 'uma-senha-bem-longa',
    })
    expect(admin).toEqual({ name: LOCAL_SEED_ADMIN.name, email: 'prof@cesar.school', password: 'uma-senha-bem-longa' })
  })

  it('rejects short passwords and half-filled settings', () => {
    expect(() =>
      resolveSeedAdmin({ DATABASE_URL: remoteDb, SEED_ADMIN_EMAIL: 'a@b.c', SEED_ADMIN_PASSWORD: 'curta' }),
    ).toThrow(/at least 12 characters/)
    expect(() => resolveSeedAdmin({ DATABASE_URL: localDb, SEED_ADMIN_EMAIL: 'a@b.c' })).toThrow(
      /SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/,
    )
  })
})
