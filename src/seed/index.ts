import config from '@payload-config'
import { getPayload } from 'payload'

import { SEED_ADMIN, seed } from './seed'

const payload = await getPayload({ config })
await seed(payload)
payload.logger.info(`Seed complete. Admin login: ${SEED_ADMIN.email} / ${SEED_ADMIN.password}`)
process.exit(0)
