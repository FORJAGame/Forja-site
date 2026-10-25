import { slugField as payloadSlugField, type Field, type PayloadRequest, type TextField } from 'payload'

import { slugify } from '@/utilities/slugify'

type SluggedCollection = 'guilds' | 'games'

const slugFrom = (value: unknown): string | undefined => (typeof value === 'string' && slugify(value)) || undefined

// Two guilds can name a game the same. Drafts live in the versions table, which has no unique index,
// so the clash would only surface when an admin publishes; a suffix (`ecos-2`) avoids it up front.
const freeSlugFrom = async (
  value: unknown,
  collection: SluggedCollection,
  req: PayloadRequest,
  ownId: unknown,
): Promise<string | undefined> => {
  const base = slugFrom(value)
  if (!base) return undefined

  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`
    const sameSlug = { slug: { equals: candidate } }
    const { totalDocs } = await req.payload.count({
      collection,
      where: ownId ? { and: [sameSlug, { id: { not_equals: ownId } }] } : sameSlug,
      overrideAccess: true,
      req,
    })
    if (totalDocs === 0) return candidate
  }
}

// Payload's slug field keeps following the title through autosaves until the first publish or a
// manual edit, then freezes so published URLs never change by accident.
export const slugField = (sourceField: string, collection: SluggedCollection): Field =>
  payloadSlugField({
    useAsSlug: sourceField,
    slugify: ({ valueToSlugify, data, req }) => freeSlugFrom(valueToSlugify, collection, req, data?.id),
    overrides: (row) => {
      const [generateSlugCheckbox, slug] = row.fields as [Field, TextField]
      return {
        ...row,
        fields: [
          generateSlugCheckbox,
          {
            ...slug,
            label: 'Slug',
            admin: {
              ...slug.admin,
              description: 'Segue o nome até a primeira publicação. Depois fica fixo, porque aparece na URL.',
            },
            hooks: {
              ...slug.hooks,
              // Payload fills the slug only after validation, so a published create without one would
              // fail `required`. Updates are left alone: a value set here would count as a manual edit.
              beforeValidate: [
                ({ value, data, operation }) =>
                  operation === 'create' && !value ? (slugFrom(data?.[sourceField]) ?? null) : value,
              ],
            },
          },
        ],
      }
    },
  })
