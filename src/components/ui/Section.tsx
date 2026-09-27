import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

import { Container } from './Container'

type SectionProps = { id: string; labelledBy: string; className?: string; children: ReactNode }

export function Section({ id, labelledBy, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('scroll-mt-20 border-t border-divider py-section-mobile md:py-section', className)}
    >
      <Container>{children}</Container>
    </section>
  )
}
