import 'dotenv/config'

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST is not set. Copy .env.example to .env.')
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
