export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-forge [font-family:var(--font-inter)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
      {external ? '↗' : '→'}
    </span>
  )
}
