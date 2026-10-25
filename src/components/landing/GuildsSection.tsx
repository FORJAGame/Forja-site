import { GuildGrid } from '@/components/guilds/GuildGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GuildCardView } from '@/lib/presenters'

const GUILDS_ON_MOBILE = 4

export function GuildsSection({ guilds }: { guilds: GuildCardView[] }) {
  const copy = landingCopy.guilds

  return (
    <Section id="guildas" labelledBy="guildas-title">
      <SectionHeader
        id="guildas-title"
        number="03"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/guildas', label: copy.link }}
      />
      {guilds.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <GuildGrid guilds={guilds} mobileLimit={GUILDS_ON_MOBILE} />
      )}
    </Section>
  )
}
