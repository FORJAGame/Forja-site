import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import type { GuildCardView } from '@/lib/presenters'
import { cx } from '@/utilities/cx'

import { GuildCard } from './GuildCard'

type GuildGridProps = { guilds: GuildCardView[]; mobileLimit?: number }

export function GuildGrid({ guilds, mobileLimit }: GuildGridProps) {
  return (
    <RevealGroup as="ul" className="grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-4">
      {guilds.map((guild, index) => (
        <RevealItem
          as="li"
          key={guild.id}
          className={cx(mobileLimit !== undefined && index >= mobileLimit && 'max-md:hidden')}
        >
          <GuildCard guild={guild} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
