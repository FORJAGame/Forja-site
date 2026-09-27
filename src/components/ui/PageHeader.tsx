import { Reveal } from '@/components/motion/Reveal'

import { Container } from './Container'
import { Eyebrow } from './Eyebrow'
import { LineBreaks } from './LineBreaks'

type PageHeaderProps = { eyebrow: string; title: string; description?: string }

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <Container className="pb-2xl pt-2xl md:pt-3xl">
      <Reveal className="flex flex-col gap-md">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="type-headline-lg-mobile break-words md:type-headline-lg">
          <LineBreaks text={title} />
        </h1>
        {description && <p className="type-body-lg max-w-measure text-on-surface-variant">{description}</p>}
      </Reveal>
    </Container>
  )
}
