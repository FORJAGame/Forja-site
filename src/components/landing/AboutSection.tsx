import { Reveal } from '@/components/motion/Reveal'
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Stat } from '@/components/ui/Stat'
import { landingCopy } from '@/content/landing'
import type { LandingStats } from '@/lib/queries/landing'

export function AboutSection({ stats }: { stats: LandingStats }) {
  const { about } = landingCopy

  return (
    <Section id="sobre" labelledBy="sobre-title">
      <SectionHeader id="sobre-title" number="01" eyebrow={about.eyebrow} title={about.title} />
      <div className="grid gap-2xl md:grid-cols-2">
        <Reveal className="flex max-w-[560px] flex-col gap-md">
          <p className="type-body-lg">{about.lead}</p>
          <p className="type-body-lg text-on-surface-variant">{about.detail}</p>
        </Reveal>
        <RevealGroup as="ul" label="A Forja em números" className="grid grid-cols-3 self-start">
          <RevealItem as="li">
            <Stat value={stats.guilds} label={about.stats.guilds} />
          </RevealItem>
          <RevealItem as="li">
            <Stat value={stats.games} label={about.stats.games} />
          </RevealItem>
          <RevealItem as="li">
            <Stat value={stats.articles} label={about.stats.articles} />
          </RevealItem>
        </RevealGroup>
      </div>
    </Section>
  )
}
