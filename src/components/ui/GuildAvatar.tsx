import Image from 'next/image'

import type { MediaView } from '@/lib/views'
import { cx } from '@/utilities/cx'

const SIZE_CLASSES = { sm: 'size-12', md: 'size-14' } as const

type GuildAvatarProps = { initials: string; logo: MediaView | null; size?: keyof typeof SIZE_CLASSES }

export function GuildAvatar({ initials, logo, size = 'md' }: GuildAvatarProps) {
  return (
    <span
      className={cx(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-outline-strong bg-surface-raised',
        SIZE_CLASSES[size],
      )}
    >
      {logo ? (
        <Image src={logo.url} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span className="type-label-mono normal-case text-on-surface">{initials}</span>
      )}
    </span>
  )
}
