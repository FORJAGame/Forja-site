import { GameGrid } from '@/components/games/GameGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'
import type { GameCardView } from '@/lib/presenters'

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
        <GameGrid games={games} layout="carousel" />
      )}
    </Section>
  )
}
