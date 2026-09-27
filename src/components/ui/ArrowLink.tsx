import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

import { Arrow } from './Arrow'

type ArrowLinkProps = { href: string; external?: boolean; className?: string; children: ReactNode }

export function ArrowLink({ href, external = false, className, children }: ArrowLinkProps) {
  const classes = cx('group type-button inline-flex items-center gap-sm text-on-surface', className)

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {children} <span className="sr-only">(abre em nova aba)</span>
      <Arrow external />
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
      <Arrow />
    </Link>
  )
}
