import type { ReactNode } from 'react'

export function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="type-headline-md mb-xl">
      {children}
    </h2>
  )
}
