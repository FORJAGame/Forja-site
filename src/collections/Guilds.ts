import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrOwnGuild, adminOrOwnGuildDraft, publishedOrOwnGuild } from '@/access'
import { publicationFields } from '@/fields/publication'
import { simpleRichTextEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'
import { validateRequiredHttpUrl } from '@/fields/validators'
import { preventDeletingGuildInUse } from '@/hooks/preventDeletingGuildInUse'
import {
  draftVersions,
  recordPublisher,
  requireDraftForNonAdmins,
  requireDraftModeForNonAdmins,
} from '@/hooks/publication'
import { revalidateAfterDelete, revalidateOnPublish } from '@/hooks/revalidation'
import { previewAdminOptions } from '@/lib/preview'

export const Guilds: CollectionConfig = {
  slug: 'guilds',
  labels: { singular: 'Guilda', plural: 'Guildas' },
  admin: {
    useAsTitle: 'name', defaultColumns: ['name', 'slug', 'updatedAt'],
    ...previewAdminOptions('guilds'),
  },
  access: {
    read: publishedOrOwnGuild('id'),
    readVersions: adminOrOwnGuild('parent'),
    create: adminOnly,
    update: adminOrOwnGuildDraft('id'),
    delete: adminOnly,
  },
  versions: draftVersions,
  hooks: {
    beforeOperation: [requireDraftModeForNonAdmins],
    beforeChange: [requireDraftForNonAdmins, recordPublisher],
    beforeDelete: [preventDeletingGuildInUse],
    afterChange: [revalidateOnPublish],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    slugField('name', 'guilds'),
    {
      name: 'shortDescription',
      label: 'Descrição curta',
      type: 'textarea',
      required: true,
      maxLength: 160,
      admin: { description: 'Aparece nos cards. Até 160 caracteres.' },
    },
    { name: 'description', label: 'Descrição', type: 'richText', editor: simpleRichTextEditor },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'cover', label: 'Capa', type: 'upload', relationTo: 'media' },
    {
      name: 'links',
      label: 'Links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        {
          name: 'platform',
          label: 'Plataforma',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'itch.io', value: 'itch' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Site', value: 'website' },
            { label: 'Outro', value: 'other' },
          ],
        },
        { name: 'url', label: 'URL', type: 'text', validate: validateRequiredHttpUrl },
      ],
    },
    {
      name: 'members',
      label: 'Membros',
      type: 'textarea',
      admin: { description: 'Opcional. Um nome por linha.' },
    },
    ...publicationFields,
  ],
}
