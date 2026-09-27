import type { CollectionConfig } from 'payload'

import { adminOnly, anyone, authenticated } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagem', plural: 'Imagens' },
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
