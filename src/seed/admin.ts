import { isLocalDatabase } from '@/config/env'

export type SeedAdmin = { name: string; email: string; password: string }

export const LOCAL_SEED_ADMIN: SeedAdmin = { name: 'Admin Forja', email: 'admin@forja.local', password: 'forja-dev' }

const MIN_PASSWORD_LENGTH = 12

// The local login is published in the repository, so it must never reach a database others can open.
export const resolveSeedAdmin = (env: Record<string, string | undefined>): SeedAdmin => {
  const email = env.SEED_ADMIN_EMAIL?.trim() ?? ''
  const password = env.SEED_ADMIN_PASSWORD ?? ''
  const missingSettings = 'Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD'

  if (email && password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`SEED_ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters.`)
    }
    return { name: LOCAL_SEED_ADMIN.name, email, password }
  }
  if (email || password) throw new Error(`${missingSettings}, or neither.`)
  if (isLocalDatabase(env.DATABASE_URL ?? '')) return LOCAL_SEED_ADMIN

  throw new Error(`${missingSettings} to seed a remote database; the local admin password is public.`)
}
