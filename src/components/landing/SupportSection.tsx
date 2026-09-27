import { DiagonalBands } from '@/components/brand/DiagonalBands'
import { Shards } from '@/components/brand/Shards'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LineBreaks } from '@/components/ui/LineBreaks'
import { siteConfig } from '@/config/site'
import { landingCopy } from '@/content/landing'

export function SupportSection() {
  const { support } = landingCopy
  const mailto = `mailto:${siteConfig.email}`

  return (
    <section id="apoie" aria-labelledby="apoie-title" className="scroll-mt-20 py-lg md:py-section">
      <Container>
        <Reveal className="relative isolate overflow-hidden bg-primary px-lg py-2xl md:px-3xl md:py-3xl">
          <DiagonalBands tone="ink" className="-z-10" />
          <Shards className="absolute -top-[10%] right-[-6%] -z-10 w-[55%] max-w-[520px] text-neutral opacity-20" />
          <div className="flex flex-col gap-2xl md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-[560px] flex-col gap-lg">
              <Eyebrow tone="onPrimary">06 / {support.eyebrow}</Eyebrow>
              <h2 id="apoie-title" className="type-headline-lg-mobile text-on-primary md:type-headline-lg">
                <LineBreaks text={support.title} />
              </h2>
              <p className="type-body-lg text-on-primary">{support.text}</p>
            </div>
            <div className="flex flex-col gap-md md:items-end">
              <ButtonLink href={mailto} variant="onPrimary" arrow className="max-md:w-full">
                {support.action}
              </ButtonLink>
              <a href={mailto} className="type-label-mono normal-case text-on-primary">
                {siteConfig.email}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
