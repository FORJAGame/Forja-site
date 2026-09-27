import type { CollectionConfig } from 'payload'

import { adminOnly, anyone } from '@/access'
import { validateRequiredHttpUrl } from '@/fields/validators'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Artigo', plural: 'Artigos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'venue', 'date'] },
  defaultSort: '-date',
  access: {
    read: anyone,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    {
      name: 'authors',
      label: 'Autores',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Autor', plural: 'Autores' },
      fields: [{ name: 'name', label: 'Nome', type: 'text', required: true }],
    },
    { name: 'date', label: 'Data', type: 'date', required: true },
    {
      name: 'venue',
      label: 'Veículo',
      type: 'text',
      required: true,
      admin: { description: 'Revista ou evento. Ex.: SBGames 2026.' },
    },
    {
      name: 'url',
      label: 'Link da publicação',
      type: 'text',
      validate: validateRequiredHttpUrl,
      admin: { description: 'Se houver DOI, prefira o link https://doi.org/..., que não quebra.' },
    },
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      admin: { position: 'sidebar', description: 'Opcional. Usado só para filtrar.' },
    },
    { name: 'tags', label: 'Tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
  ],
}
