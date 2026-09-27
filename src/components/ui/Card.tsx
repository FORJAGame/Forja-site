import Link from 'next/link'
import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

type CardProps = { as?: 'article' | 'div'; className?: string; children: ReactNode }

export function Card({ as: Tag = 'article', className, children }: CardProps) {
  return (
    <Tag
      className={cx(
        'group relative flex flex-col overflow-hidden border border-outline bg-surface transition-colors duration-200 ease-forge hover:border-primary/50 focus-within:border-primary/50',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute left-0 top-0 z-10 h-1 w-14 bg-primary" />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 ease-forge group-hover:scale-x-100 group-focus-within:scale-x-100 motion-reduce:transition-none"
      />
      {children}
    </Tag>
  )
}

export function CardLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx('after:absolute after:inset-0', className)}>
      {children}
    </Link>
  )
}
