export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-forge group-hover:translate-x-1">
      {external ? '↗' : '→'}
    </span>
  )
}
