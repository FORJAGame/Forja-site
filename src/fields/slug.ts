import type { Field } from 'payload'

import { slugify } from '@/utilities/slugify'

export const slugField = (sourceField: string): Field => ({
  name: 'slug',
  label: 'Slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Gerado automaticamente a partir do nome. Aparece na URL.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) =>
        slugify(typeof value === 'string' && value ? value : String(data?.[sourceField] ?? '')) || null,
    ],
  },
})
