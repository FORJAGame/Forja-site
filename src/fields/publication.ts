import type { Field } from 'payload'

export const publicationFields: Field[] = [
  {
    name: 'publishedBy',
    label: 'Publicado por',
    type: 'relationship',
    relationTo: 'users',
    admin: { readOnly: true, position: 'sidebar' },
  },
  {
    name: 'publishedAt',
    label: 'Publicado em',
    type: 'date',
    admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
  },
]
