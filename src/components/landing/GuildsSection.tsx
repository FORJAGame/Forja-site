import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GuildCardView } from '@/lib/presenters'
import { cx } from '@/utilities/cx'

import { EmptyState } from './EmptyState'
import { GuildCard } from './GuildCard'

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
        <RevealGroup as="ul" className="grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-4">
          {guilds.map((guild, index) => (
            <RevealItem as="li" key={guild.id} className={cx(index >= GUILDS_ON_MOBILE && 'max-md:hidden')}>
              <GuildCard guild={guild} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
