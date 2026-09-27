import { Reveal } from '@/components/motion/Reveal'

import { ArrowLink } from './ArrowLink'
import { Eyebrow } from './Eyebrow'
import { LineBreaks } from './LineBreaks'

type SectionHeaderProps = {
  id: string
  number?: string
  eyebrow: string
  title: string
  link?: { href: string; label: string }
}

export function SectionHeader({ id, number, eyebrow, title, link }: SectionHeaderProps) {
  return (
    <Reveal className="mb-2xl flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-md">
        <Eyebrow>{number ? `${number} / ${eyebrow}` : eyebrow}</Eyebrow>
        <h2 id={id} className="type-headline-lg-mobile md:type-headline-lg">
          <LineBreaks text={title} />
        </h2>
      </div>
      {link && <ArrowLink href={link.href}>{link.label}</ArrowLink>}
    </Reveal>
  )
}
