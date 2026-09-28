import Link from 'next/link'
import type { ReactNode } from 'react'

import { Arrow } from './Arrow'

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group type-button inline-flex items-center gap-sm text-on-surface-variant hover:text-on-surface">
      <Arrow direction="back" />
      {children}
    </Link>
  )
}
