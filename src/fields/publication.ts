import type { Field } from 'payload'

import { adminOnlyField } from '@/access'

const adminWritesOnly = { create: adminOnlyField, update: adminOnlyField }

export const publicationFields: Field[] = [
  {
    name: 'publishedBy',
    label: 'Publicado por',
    type: 'relationship',
    relationTo: 'users',
    access: adminWritesOnly,
    admin: { readOnly: true, position: 'sidebar' },
  },
  {
    name: 'publishedAt',
    label: 'Publicado em',
    type: 'date',
    access: adminWritesOnly,
    admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
  },
]
