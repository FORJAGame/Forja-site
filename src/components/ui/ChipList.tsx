import { cx } from '@/utilities/cx'

type ChipListProps = { items: string[]; label: string; className?: string }

export function ChipList({ items, label, className }: ChipListProps) {
  return (
    <ul aria-label={label} className={cx('flex flex-wrap gap-sm', className)}>
      {items.map((item) => (
        <li key={item} className="type-label-mono-sm max-w-full break-words bg-surface-raised px-sm py-xs text-on-surface-variant">
          {item}
        </li>
      ))}
    </ul>
  )
}
