import { EmptyState } from '@/components/landing/EmptyState'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { GameCardView } from '@/lib/presenters'

import { GameGrid } from './GameGrid'

export function GamesIndex({ games }: { games: GameCardView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Jogos"
        title={'Feito nas\nguildas.'}
        description="Protótipos, jogos em desenvolvimento e lançamentos das guildas da Forja."
      />
      <Container className="pb-section-mobile md:pb-section">
        {games.length === 0 ? <EmptyState>{landingCopy.games.empty}</EmptyState> : <GameGrid games={games} />}
      </Container>
    </>
  )
}
