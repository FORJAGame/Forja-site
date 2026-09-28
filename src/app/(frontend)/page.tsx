import config from '@payload-config'
import { getPayload } from 'payload'

import { AboutSection } from '@/components/landing/AboutSection'
import { FeaturedGamesSection } from '@/components/landing/FeaturedGamesSection'
import { GuildsSection } from '@/components/landing/GuildsSection'
import { Hero } from '@/components/landing/Hero'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { RecentArticlesSection } from '@/components/landing/RecentArticlesSection'
import { SupportSection } from '@/components/landing/SupportSection'
import { getLandingData } from '@/lib/queries/landing'

// Publishing already refreshes the site (src/hooks/revalidation.ts); the timer is only a safety net.
export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayload({ config })
  const { stats, guilds, games, articles } = await getLandingData(payload)

  return (
    <>
      <Hero guildCount={stats.guilds} />
      <AboutSection stats={stats} />
      <HowItWorksSection />
      <GuildsSection guilds={guilds} />
      <FeaturedGamesSection games={games} />
      <RecentArticlesSection articles={articles} />
      <SupportSection />
    </>
  )
}
