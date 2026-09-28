import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

import { Container } from './Container'
import { SectionTitle } from './SectionTitle'

type SectionProps = {
  id: string
  labelledBy: string
  title?: string
  className?: string
  children: ReactNode
}

export function Section({ id, labelledBy, title, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('scroll-mt-20 border-t border-divider py-section-mobile md:py-section', className)}
    >
      <Container>
        {title && <SectionTitle id={labelledBy}>{title}</SectionTitle>}
        {children}
      </Container>
    </section>
  )
}
