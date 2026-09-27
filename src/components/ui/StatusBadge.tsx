import type { DevelopmentStatus } from '@/lib/views'
import { cx } from '@/utilities/cx'

const STATUS: Record<DevelopmentStatus, { label: string; className: string }> = {
  'in-development': { label: 'Em desenvolvimento', className: 'bg-primary-tint text-primary-text' },
  released: { label: 'Lançado', className: 'bg-surface-raised text-on-surface' },
  paused: { label: 'Pausado', className: 'border border-outline-strong text-on-surface-muted' },
}

export function StatusBadge({ status }: { status: DevelopmentStatus }) {
  const { label, className } = STATUS[status]

  return (
    <span className={cx('type-label-mono-sm inline-flex w-fit items-center gap-1.5 px-sm py-xs', className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
