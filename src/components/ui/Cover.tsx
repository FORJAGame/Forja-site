import Image from 'next/image'

import { Shards } from '@/components/brand/Shards'
import type { MediaView } from '@/lib/views'
import { cx } from '@/utilities/cx'

const RATIO_CLASSES = { video: 'aspect-video', banner: 'aspect-[12/5]' } as const

type CoverProps = { image: MediaView | null; ratio: keyof typeof RATIO_CLASSES; sizes: string; className?: string }

export function Cover({ image, ratio, sizes, className }: CoverProps) {
  return (
    <div className={cx('relative overflow-hidden bg-linear-to-br from-ember to-surface-raised', RATIO_CLASSES[ratio], className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 ease-forge group-hover:scale-[1.03]"
        />
      ) : (
        <Shards className="absolute -bottom-[12%] right-[4%] w-[36%] text-primary opacity-45" />
      )}
    </div>
  )
}
