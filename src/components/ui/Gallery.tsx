import Image from 'next/image'

import type { MediaView } from '@/lib/views'

export function Gallery({ images }: { images: MediaView[] }) {
  return (
    <ul className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <li key={image.url} className="relative aspect-video overflow-hidden border border-outline bg-surface">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  )
}
