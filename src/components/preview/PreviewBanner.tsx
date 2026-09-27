import { Container } from '@/components/ui/Container'

export function PreviewBanner() {
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 border-t border-primary bg-surface-raised">
      <Container className="flex items-center justify-between gap-md py-sm">
        <p className="type-label-mono text-primary-text">Pré-visualização do rascunho</p>
        {/* A plain anchor: prefetching the exit route would switch draft mode off by itself. */}
        <a href="/preview/exit" className="type-button text-on-surface">
          Sair da pré-visualização
        </a>
      </Container>
    </div>
  )
}
