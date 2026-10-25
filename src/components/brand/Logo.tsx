import Image from 'next/image'

import { cx } from '@/utilities/cx'

export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/forja-logo.png"
      width={2048}
      height={687}
      alt="Forja"
      priority={priority}
      className={cx('h-auto', className)}
    />
  )
}
