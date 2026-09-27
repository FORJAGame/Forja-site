import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GameCardView } from '@/lib/presenters'

import { EmptyState } from './EmptyState'
import { GameCard } from './GameCard'

export function FeaturedGamesSection({ games }: { games: GameCardView[] }) {
  const copy = landingCopy.games

  return (
    <Section id="jogos" labelledBy="jogos-title">
      <SectionHeader
        id="jogos-title"
        number="04"
        eyebrow={copy.eyebrow}
        title={copy.title}
        link={{ href: '/jogos', label: copy.link }}
      />
      {games.length === 0 ? (
        <EmptyState>{copy.empty}</EmptyState>
      ) : (
        <RevealGroup
          as="ul"
          className="-mx-margin-mobile flex snap-x snap-mandatory gap-md overflow-x-auto px-margin-mobile pb-md md:mx-0 md:grid md:grid-cols-3 md:gap-lg md:overflow-visible md:px-0 md:pb-0"
        >
          {games.map((game) => (
            <RevealItem as="li" key={game.id} className="w-[85%] shrink-0 snap-start md:w-auto">
              <GameCard game={game} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  )
}
