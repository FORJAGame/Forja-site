import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { GuildProfile } from '@/components/guilds/GuildProfile'
import { PreviewTools } from '@/components/preview/PreviewTools'
import { getGuildPage, listGuildSlugs } from '@/lib/queries/guilds'
import { resolveViewer } from '@/lib/queries/viewer'

type GuildPageProps = { params: Promise<{ slug: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  return (await listGuildSlugs(payload)).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: GuildPageProps): Promise<Metadata> {
  const payload = await getPayload({ config })
  const guild = await getGuildPage(payload, (await params).slug)
  return guild ? { title: guild.name, description: guild.shortDescription } : {}
}

export default async function GuildPage({ params }: GuildPageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const viewer = await resolveViewer(payload)
  const guild = await getGuildPage(payload, slug, viewer)
  if (!guild) notFound()

  return (
    <>
      {viewer.draft && <PreviewTools />}
      <GuildProfile guild={guild} />
    </>
  )
}
