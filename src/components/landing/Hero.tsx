import { Container } from '@/components/ui/Container'

import { HeroBackdrop } from './HeroBackdrop'
import { HeroContent } from './HeroContent'

export function Hero({ guildCount }: { guildCount: number }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />
      <Container className="flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-section-mobile pt-[45vw] md:justify-center md:pt-section lg:min-h-[784px]">
        <HeroContent guildCount={guildCount} />
      </Container>
    </section>
  )
}
