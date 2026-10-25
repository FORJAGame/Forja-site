import type { ReactNode } from 'react'

import { cx } from '@/utilities/cx'

const TONE_CLASSES = {
  accent: 'text-primary-text',
  onPrimary: 'text-on-primary',
} as const

type EyebrowProps = { tone?: keyof typeof TONE_CLASSES; className?: string; children: ReactNode }

export function Eyebrow({ tone = 'accent', className, children }: EyebrowProps) {
  return <p className={cx('type-label-mono', TONE_CLASSES[tone], className)}>{children}</p>
}
