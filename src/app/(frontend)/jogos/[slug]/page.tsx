import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { GameDetail } from '@/components/games/GameDetail'
import { PreviewTools } from '@/components/preview/PreviewTools'
import { getGamePage, listGameSlugs } from '@/lib/queries/games'
import { resolveViewer } from '@/lib/queries/viewer'

type GamePageProps = { params: Promise<{ slug: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  return (await listGameSlugs(payload)).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const payload = await getPayload({ config })
  const game = await getGamePage(payload, (await params).slug)
  return game ? { title: game.title, description: game.synopsis } : {}
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const viewer = await resolveViewer(payload)
  const game = await getGamePage(payload, slug, viewer)
  if (!game) notFound()

  return (
    <>
      {viewer.draft && <PreviewTools />}
      <GameDetail game={game} />
    </>
  )
}
