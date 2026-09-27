// The three red sparks of the logo, measured from forja-logo.png and normalized to their bounding box.
export const SHARD_POLYGONS = [
  '16,45 96,137 90,158 10,82',
  '85,0 272,238 250,240 126,142',
  '0,128 184,258 184,283 12,283 96,247',
] as const

export function Shards({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 272 283" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {SHARD_POLYGONS.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  )
}
