import { Card, CardLink } from '@/components/ui/Card'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import type { GuildCardView } from '@/lib/presenters'

export function GuildCard({ guild }: { guild: GuildCardView }) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-md p-md md:flex-col md:items-start md:gap-lg md:p-lg">
        <GuildAvatar initials={guild.initials} logo={guild.logo} />
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <h3 className="type-headline-sm break-words md:type-headline-md">
            <CardLink href={guild.href}>{guild.name}</CardLink>
          </h3>
          <p className="type-body-sm text-on-surface-muted">{guild.focus}</p>
        </div>
        <p className="type-label-mono-sm text-on-surface-muted max-md:hidden">{guild.meta}</p>
        <span aria-hidden="true" className="text-on-surface-variant md:hidden">
          →
        </span>
      </div>
    </Card>
  )
}
