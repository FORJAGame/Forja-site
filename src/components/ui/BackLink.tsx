import Link from 'next/link'
import type { ReactNode } from 'react'

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group type-button inline-flex items-center gap-sm text-on-surface-variant hover:text-on-surface">
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-200 ease-forge [font-family:var(--font-inter)] group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      >
        ←
      </span>
      {children}
    </Link>
  )
}
