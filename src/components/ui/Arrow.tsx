import { cx } from '@/utilities/cx'

const DIRECTIONS = {
  forward: { glyph: '→', hoverShift: 'group-hover:translate-x-1' },
  external: { glyph: '↗', hoverShift: 'group-hover:translate-x-1' },
  back: { glyph: '←', hoverShift: 'group-hover:-translate-x-1' },
} as const

export type ArrowDirection = keyof typeof DIRECTIONS

export function Arrow({ direction = 'forward' }: { direction?: ArrowDirection }) {
  const { glyph, hoverShift } = DIRECTIONS[direction]

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-block transition-transform duration-200 ease-forge [font-family:var(--font-inter)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
        hoverShift,
      )}
    >
      {glyph}
    </span>
  )
}
