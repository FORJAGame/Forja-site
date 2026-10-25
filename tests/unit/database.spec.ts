import { describe, expect, it } from 'vitest'

import { describeDatabaseTarget, explainDatabaseError } from '@/config/database'

const errorWithCode = (code: string, message = 'boom') => Object.assign(new Error(message), { code })

describe('describeDatabaseTarget', () => {
  it('shows host, port and database without the credentials', () => {
    expect(describeDatabaseTarget('postgresql://user:secret@db.example.com:6543/forja?sslmode=require')).toBe(
      'db.example.com:6543/forja',
    )
  })

  it('falls back to the default Postgres port', () => {
    expect(describeDatabaseTarget('postgresql://user:secret@db.example.com/forja')).toBe('db.example.com:5432/forja')
  })

  it('does not echo an unparseable URL, which may contain a password', () => {
    expect(describeDatabaseTarget('not a url with secret')).toBe('DATABASE_URL (not a valid URL)')
  })
})

describe('explainDatabaseError', () => {
  const target = 'db.example.com:5432/forja'

  it.each([
    ['ENOTFOUND', 'Database host not found (db.example.com:5432/forja). Check the host in DATABASE_URL.'],
    [
      'ECONNREFUSED',
      'Nothing is accepting connections at db.example.com:5432/forja. Check that Postgres is running and that DATABASE_URL points to it.',
    ],
    ['28P01', 'The database at db.example.com:5432/forja rejected the user or password in DATABASE_URL.'],
    ['3D000', 'The database db.example.com:5432/forja does not exist. Create it or fix its name in DATABASE_URL.'],
  ])('explains %s', (code, expected) => {
    expect(explainDatabaseError(errorWithCode(code), target)).toBe(expected)
  })

  it('keeps the original message for anything else', () => {
    expect(explainDatabaseError(new Error('self-signed certificate'), target)).toBe(
      'Could not connect to the database at db.example.com:5432/forja: self-signed certificate',
    )
  })
})
