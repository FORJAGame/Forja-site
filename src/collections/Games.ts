import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrGuildMember, adminOrOwnGuild, adminOrOwnGuildDraft, publishedOrOwnGuild } from '@/access'
import { publicationFields } from '@/fields/publication'
import { simpleRichTextEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'
import { validateOptionalHttpUrl, validateOptionalYouTubeUrl } from '@/fields/validators'
import { assignOwnGuild } from '@/hooks/assignOwnGuild'
import {
  draftVersions,
  recordPublisher,
  requireDraftForNonAdmins,
  requireDraftModeForNonAdmins,
} from '@/hooks/publication'

export const Games: CollectionConfig = {
  slug: 'games',
  labels: { singular: 'Jogo', plural: 'Jogos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'guild', 'developmentStatus', 'updatedAt'] },
  access: {
    read: publishedOrOwnGuild('guild'),
    readVersions: adminOrOwnGuild('version.guild'),
    create: adminOrGuildMember,
    update: adminOrOwnGuildDraft('guild'),
    delete: adminOnly,
  },
  versions: draftVersions,
  hooks: {
    beforeOperation: [requireDraftModeForNonAdmins],
    beforeChange: [assignOwnGuild, requireDraftForNonAdmins, recordPublisher],
  },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    slugField('title'),
    {
      name: 'guild',
      label: 'Guilda',
      type: 'relationship',
      relationTo: 'guilds',
      required: true,
      admin: { position: 'sidebar', description: 'Editores sempre publicam na própria guilda.' },
    },
    {
      name: 'developmentStatus',
      label: 'Status do jogo',
      type: 'select',
      required: true,
      defaultValue: 'in-development',
      options: [
        { label: 'Em desenvolvimento', value: 'in-development' },
        { label: 'Lançado', value: 'released' },
        { label: 'Pausado', value: 'paused' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'synopsis',
      label: 'Sinopse',
      type: 'textarea',
      required: true,
      maxLength: 280,
      admin: { description: 'Aparece nos cards. Até 280 caracteres.' },
    },
    { name: 'cover', label: 'Capa (16:9)', type: 'upload', relationTo: 'media' },
    { name: 'gallery', label: 'Galeria', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'trailerUrl',
      label: 'Trailer (YouTube)',
      type: 'text',
      validate: validateOptionalYouTubeUrl,
    },
    { name: 'description', label: 'Descrição', type: 'richText', editor: simpleRichTextEditor },
    {
      name: 'platforms',
      label: 'Plataformas',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'PC', value: 'pc' },
        { label: 'Web', value: 'web' },
        { label: 'Mobile', value: 'mobile' },
        { label: 'Console', value: 'console' },
      ],
    },
    {
      name: 'playUrl',
      label: 'Link para jogar',
      type: 'text',
      validate: validateOptionalHttpUrl,
      admin: { description: 'Normalmente a página do jogo na itch.io.' },
    },
    { name: 'credits', label: 'Créditos', type: 'textarea' },
    { name: 'releaseDate', label: 'Data', type: 'date' },
    ...publicationFields,
  ],
}
