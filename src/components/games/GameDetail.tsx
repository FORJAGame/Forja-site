import Link from 'next/link'

import { RichTextContent } from '@/components/content/RichTextContent'
import { Reveal } from '@/components/motion/Reveal'
import { BackLink } from '@/components/ui/BackLink'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ChipList } from '@/components/ui/ChipList'
import { Container } from '@/components/ui/Container'
import { Cover } from '@/components/ui/Cover'
import { Gallery } from '@/components/ui/Gallery'
import { Section } from '@/components/ui/Section'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed'
import type { GamePageView } from '@/lib/presenters'

export function GameDetail({ game }: { game: GamePageView }) {
  return (
    <article>
      <Container className="pt-xl">
        <BackLink href="/jogos">Todos os jogos</BackLink>
      </Container>

      <Container className="grid gap-2xl py-2xl lg:grid-cols-2 lg:items-center">
        <Reveal className="flex min-w-0 flex-col gap-lg">
          <StatusBadge status={game.status} />
          <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">{game.title}</h1>
          {game.guild && (
            <Link
              href={game.guild.href}
              className="type-label-mono w-fit text-on-surface-variant underline underline-offset-4 hover:text-on-surface"
            >
              {game.guild.name}
            </Link>
          )}
          <p className="type-body-lg max-w-measure break-words text-on-surface-variant">{game.synopsis}</p>
          <div className="flex flex-col gap-md md:flex-row md:items-center">
            {game.playUrl && (
              <ButtonLink href={game.playUrl} newTab arrow className="max-md:w-full">
                Jogar{' '}
                <span className="sr-only">(abre em nova aba)</span>
              </ButtonLink>
            )}
            {game.platforms.length > 0 && <ChipList label="Plataformas" items={game.platforms} />}
          </div>
          {game.releaseDate && <p className="type-label-mono text-on-surface-muted">{game.releaseDate}</p>}
        </Reveal>
        <Cover image={game.cover} ratio="video" sizes="(min-width: 1024px) 600px, 100vw" priority />
      </Container>

      {game.trailerVideoId && (
        <Section id="trailer" labelledBy="trailer-title">
          <SectionTitle id="trailer-title">Trailer</SectionTitle>
          <YouTubeEmbed videoId={game.trailerVideoId} title={`Trailer de ${game.title}`} />
        </Section>
      )}

      {game.description && (
        <Section id="sobre" labelledBy="sobre-title">
          <SectionTitle id="sobre-title">Sobre o jogo</SectionTitle>
          <RichTextContent data={game.description} />
        </Section>
      )}

      {game.gallery.length > 0 && (
        <Section id="galeria" labelledBy="galeria-title">
          <SectionTitle id="galeria-title">Galeria</SectionTitle>
          <Gallery images={game.gallery} />
        </Section>
      )}

      {game.credits && (
        <Section id="creditos" labelledBy="creditos-title">
          <SectionTitle id="creditos-title">Créditos</SectionTitle>
          <p className="type-body-md max-w-measure whitespace-pre-line text-on-surface-variant">{game.credits}</p>
        </Section>
      )}
    </article>
  )
}
