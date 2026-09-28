import config from '@payload-config'
import { getPayload } from 'payload'

import { LOCAL_SEED_ADMIN, resolveSeedAdmin } from './admin'
import { seed } from './seed'
import { confirmSeedTarget } from './target'

confirmSeedTarget(process.env)
const admin = resolveSeedAdmin(process.env)
const payload = await getPayload({ config })
await seed(payload, admin)

const login = admin === LOCAL_SEED_ADMIN ? `${admin.email} / ${admin.password}` : admin.email
payload.logger.info(`Seed complete. Admin login: ${login}`)
process.exit(0)
