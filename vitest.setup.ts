import 'dotenv/config'

import { vi } from 'vitest'

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST is not set. Copy .env.example to .env.')
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST

// Payload hooks call revalidatePath, which only works inside a Next.js request.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
