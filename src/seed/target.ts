import { isLocalDatabase } from '@/config/env'

// The seed deletes every guild, game, article, user and image, so a remote run must be deliberate.
export const confirmSeedTarget = (env: Record<string, string | undefined>): void => {
  if (isLocalDatabase(env.DATABASE_URL ?? '') || env.SEED_CONFIRM_REMOTE_WIPE === 'yes') return

  throw new Error(
    'The seed deletes all content, users and images of the target database. ' +
      'To seed a remote database, set SEED_CONFIRM_REMOTE_WIPE=yes.',
  )
}
