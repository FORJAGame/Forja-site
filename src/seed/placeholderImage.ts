import sharp from 'sharp'

import { SHARD_POLYGONS } from '@/components/brand/Shards'

export type PlaceholderPalette = { background: string; stripe: string; shard: string }

const SHARD_VIEWBOX = { width: 272, height: 283 }
const STRIPE_ANGLE = -28 // DESIGN.md: diagonal stripes at ~28°, like the cuts of the logo lettering.

export const placeholderSvg = (width: number, height: number, palette: PlaceholderPalette, variant: number): string => {
  const stripeWidth = Math.round(width / 10)
  const offset = (variant * stripeWidth * 1.7) % (width / 2)
  const stripes = [0, 1, 2]
    .map((index) => {
      const x = offset + index * stripeWidth * 2.2
      return `<rect x="${x}" y="${-height}" width="${stripeWidth}" height="${height * 3}" fill="${palette.stripe}" />`
    })
    .join('')
  const shardSize = Math.round(height * 0.45)
  const shardX = width - shardSize - Math.round(width * 0.08) - (variant % 3) * Math.round(width * 0.12)
  const shardY = Math.round((height - shardSize) / 2)
  const scale = shardSize / SHARD_VIEWBOX.height
  const shards = SHARD_POLYGONS.map((points) => `<polygon points="${points}" fill="${palette.shard}" />`).join('')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${palette.background}" />`,
    `<g transform="rotate(${STRIPE_ANGLE} ${width / 2} ${height / 2})">${stripes}</g>`,
    `<g transform="translate(${shardX} ${shardY}) scale(${scale})">${shards}</g>`,
    '</svg>',
  ].join('')
}

export const renderPlaceholderPng = (
  width: number,
  height: number,
  palette: PlaceholderPalette,
  variant: number,
): Promise<Buffer> => sharp(Buffer.from(placeholderSvg(width, height, palette, variant))).png().toBuffer()
