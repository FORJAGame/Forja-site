import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, adminOrSelf } from '@/access'
import { assignFirstUserAsAdmin } from '@/hooks/assignFirstUserAsAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuário', plural: 'Usuários' },
  auth: true,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role', 'guild'] },
  access: {
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: { beforeValidate: [assignFirstUserAsAdmin] },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    {
      name: 'role',
      label: 'Papel',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
      validate: (value: unknown, { siblingData }: { siblingData: { role?: string } }) =>
        siblingData.role === 'editor' && !value ? 'Editores precisam pertencer a uma guilda.' : true,
    },
  ],
}
