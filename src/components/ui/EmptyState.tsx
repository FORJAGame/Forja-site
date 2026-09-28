import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="type-body-lg border border-dashed border-outline-strong p-xl text-on-surface-variant">{children}</p>
}
