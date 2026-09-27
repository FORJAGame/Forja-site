import { cx } from '@/utilities/cx'

const BAND_COLOR = { primary: 'bg-primary', ink: 'bg-neutral' } as const

type DiagonalBandsProps = { tone?: keyof typeof BAND_COLOR; className?: string }

export function DiagonalBands({ tone = 'primary', className }: DiagonalBandsProps) {
  const color = BAND_COLOR[tone]

  return (
    <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className={cx('absolute -left-1/4 top-[58%] h-[180px] w-[150%] -rotate-[28deg] opacity-10', color)} />
      <div className={cx('absolute -left-1/4 top-[82%] h-[110px] w-[150%] -rotate-[28deg] opacity-[0.06]', color)} />
      {tone === 'primary' && (
        <div className={cx('absolute -left-1/4 top-[74%] h-1.5 w-[150%] -rotate-[28deg]', color)} />
      )}
    </div>
  )
}
