import type { CollectionConfig } from 'payload'

import { adminOnly, anyone, authenticated } from '@/access'

// Vercel rejects request bodies above 4.5 MB, and uploads pass through the Payload API.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagem', plural: 'Imagens' },
  admin: {
    description: 'Imagens de até 4 MB. Comprima fotos e prints grandes antes de enviar.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: { mimeTypes: ['image/*'] },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
      admin: { description: 'Descreva a imagem para quem usa leitor de tela.' },
    },
  ],
}
