import type { Payload, TypedUser } from 'payload'

import { isPreviewCollection, publicPathFor } from '@/lib/preview'

export type PreviewTarget = { path: string } | { status: 400 | 401 | 404; message: string }

export const resolvePreviewTarget = async (
  payload: Payload,
  user: TypedUser | null,
  collection: string | null,
  id: string | null,
): Promise<PreviewTarget> => {
  if (!isPreviewCollection(collection) || !id) return { status: 400, message: 'Pré-visualização inválida.' }
  if (!user) return { status: 401, message: 'Entre no painel para pré-visualizar.' }

  const doc = await payload.findByID({
    collection,
    id,
    draft: true,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })
  if (!doc?.slug) return { status: 404, message: 'Rascunho não encontrado. Dê um nome e salve antes de pré-visualizar.' }

  return { path: publicPathFor(collection, doc.slug) }
}
