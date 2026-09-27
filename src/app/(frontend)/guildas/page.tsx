import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { GuildsIndex } from '@/components/guilds/GuildsIndex'
import { listGuilds } from '@/lib/queries/guilds'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Guildas',
  description: 'Os times de alunos que formam a Forja.',
}

export default async function GuildsPage() {
  const payload = await getPayload({ config })
  return <GuildsIndex guilds={await listGuilds(payload)} />
}
