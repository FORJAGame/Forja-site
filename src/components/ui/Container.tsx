import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'mx-auto w-full max-w-[calc(var(--spacing-content-max)_+_2*var(--spacing-margin-mobile))] px-margin-mobile',
        className,
      )}
    >
      {children}
    </div>
  )
}
