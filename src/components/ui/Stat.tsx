import { CountUp } from '@/components/motion/CountUp'

export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-sm border-l border-outline-strong px-md md:px-lg">
      <CountUp value={value} className="type-stat-mobile md:type-stat" />
      <span className="type-label-mono text-on-surface-variant">{label}</span>
    </div>
  )
}
