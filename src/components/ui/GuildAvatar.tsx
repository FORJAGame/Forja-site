import Image from 'next/image'

import type { MediaView } from '@/lib/views'

export function GuildAvatar({ initials, logo }: { initials: string; logo: MediaView | null }) {
  return (
    <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-outline-strong bg-surface-raised">
      {logo ? (
        <Image src={logo.url} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span className="type-label-mono normal-case text-on-surface">{initials}</span>
      )}
    </span>
  )
}
