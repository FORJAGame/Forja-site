import { Card, CardLink } from '@/components/ui/Card'
import { ChipList } from '@/components/ui/ChipList'
import { Cover } from '@/components/ui/Cover'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { GameCardView } from '@/lib/presenters'

export function GameCard({ game }: { game: GameCardView }) {
  const tags = [game.guildName, ...game.platforms].filter((tag): tag is string => Boolean(tag))

  return (
    <Card className="h-full">
      <Cover image={game.cover} ratio="video" sizes="(min-width: 768px) 33vw, 85vw" />
      <div className="flex flex-1 flex-col gap-md p-lg">
        <StatusBadge status={game.status} />
        <h3 className="type-headline-md break-words">
          <CardLink href={game.href}>{game.title}</CardLink>
        </h3>
        <p className="type-body-sm text-on-surface-variant">{game.synopsis}</p>
        {tags.length > 0 && <ChipList label="Guilda e plataformas" items={tags} className="mt-auto" />}
      </div>
    </Card>
  )
}
