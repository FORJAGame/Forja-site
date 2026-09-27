import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { GamesIndex } from '@/components/games/GamesIndex'
import { listGames } from '@/lib/queries/games'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jogos',
  description: 'Jogos feitos pelas guildas da Forja.',
}

export default async function GamesPage() {
  const payload = await getPayload({ config })
  return <GamesIndex games={await listGames(payload)} />
}
