import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import type { GameCardView } from '@/lib/presenters'

import { GameCard } from './GameCard'

const LAYOUT = {
  grid: { list: 'grid gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-3', item: '' },
  carousel: {
    list: '-mx-margin-mobile flex snap-x snap-mandatory gap-md overflow-x-auto px-margin-mobile pb-md md:mx-0 md:grid md:grid-cols-3 md:gap-lg md:overflow-visible md:px-0 md:pb-0',
    item: 'w-[85%] shrink-0 snap-start md:w-auto',
  },
} as const

type GameGridProps = { games: GameCardView[]; layout?: keyof typeof LAYOUT }

export function GameGrid({ games, layout = 'grid' }: GameGridProps) {
  return (
    <RevealGroup as="ul" className={LAYOUT[layout].list}>
      {games.map((game) => (
        <RevealItem as="li" key={game.id} className={LAYOUT[layout].item}>
          <GameCard game={game} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
