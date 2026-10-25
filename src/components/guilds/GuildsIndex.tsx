import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { landingCopy } from '@/content/landing'
import type { GuildCardView } from '@/lib/presenters'

import { GuildGrid } from './GuildGrid'

export function GuildsIndex({ guilds }: { guilds: GuildCardView[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Guildas"
        title={'Todas as\nguildas.'}
        description="Cada guilda é um time de alunos com foco próprio. Escolha uma para ver os jogos e a pesquisa que ela produz."
      />
      <Container className="pb-section-mobile md:pb-section">
        {guilds.length === 0 ? <EmptyState>{landingCopy.guilds.empty}</EmptyState> : <GuildGrid guilds={guilds} />}
      </Container>
    </>
  )
}
