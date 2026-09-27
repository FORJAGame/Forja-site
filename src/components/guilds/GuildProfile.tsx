import { RichTextContent } from '@/components/content/RichTextContent'
import { GameGrid } from '@/components/games/GameGrid'
import { EmptyState } from '@/components/landing/EmptyState'
import { Reveal } from '@/components/motion/Reveal'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { BackLink } from '@/components/ui/BackLink'
import { Container } from '@/components/ui/Container'
import { Cover } from '@/components/ui/Cover'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GuildAvatar } from '@/components/ui/GuildAvatar'
import { Section } from '@/components/ui/Section'
import { SectionTitle } from '@/components/ui/SectionTitle'
import type { GuildPageView } from '@/lib/presenters'

export function GuildProfile({ guild }: { guild: GuildPageView }) {
  return (
    <article>
      <Container className="flex flex-col gap-lg pt-xl">
        <BackLink href="/guildas">Todas as guildas</BackLink>
        <Cover image={guild.cover} ratio="banner" sizes="(min-width: 1248px) 1200px, 100vw" priority />
      </Container>

      <Container className="flex flex-col gap-xl py-2xl md:flex-row md:items-end md:justify-between">
        <Reveal className="flex items-start gap-lg">
          <GuildAvatar initials={guild.initials} logo={guild.logo} />
          <div className="flex min-w-0 flex-col gap-sm">
            <Eyebrow>Guilda</Eyebrow>
            <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">{guild.name}</h1>
            <p className="type-body-lg max-w-measure text-on-surface-variant">{guild.shortDescription}</p>
          </div>
        </Reveal>
        {guild.links.length > 0 && (
          <ul aria-label="Links da guilda" className="flex flex-wrap gap-lg md:justify-end">
            {guild.links.map((link) => (
              <li key={link.url}>
                <ArrowLink href={link.url} external>
                  {link.label}
                </ArrowLink>
              </li>
            ))}
          </ul>
        )}
      </Container>

      {guild.description && (
        <Section id="sobre" labelledBy="sobre-title">
          <SectionTitle id="sobre-title">Sobre</SectionTitle>
          <RichTextContent data={guild.description} />
        </Section>
      )}

      <Section id="jogos" labelledBy="jogos-title">
        <SectionTitle id="jogos-title">Jogos</SectionTitle>
        {guild.games.length === 0 ? (
          <EmptyState>Esta guilda ainda não publicou jogos.</EmptyState>
        ) : (
          <GameGrid games={guild.games} />
        )}
      </Section>

      {guild.members.length > 0 && (
        <Section id="membros" labelledBy="membros-title">
          <SectionTitle id="membros-title">Membros</SectionTitle>
          <ul aria-label="Membros" className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
            {guild.members.map((member) => (
              <li key={member} className="type-body-md text-on-surface-variant">
                {member}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  )
}
