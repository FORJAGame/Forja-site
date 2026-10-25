import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, adminOrSelf } from '@/access'
import { assignFirstUserAsAdmin } from '@/hooks/assignFirstUserAsAdmin'
import { keepOneAdminOnDelete, keepOneAdminOnDemotion } from '@/hooks/keepOneAdmin'

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
    // Payload's default lets any logged-in user unlock accounts, weakening the lock after failed logins.
    unlock: adminOnly,
  },
  hooks: {
    beforeValidate: [assignFirstUserAsAdmin],
    beforeChange: [keepOneAdminOnDemotion],
    beforeDelete: [keepOneAdminOnDelete],
  },
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
