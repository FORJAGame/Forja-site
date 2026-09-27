import { slugField as payloadSlugField, type Field, type TextField } from 'payload'

import { slugify } from '@/utilities/slugify'

const slugFrom = (value: unknown): string | undefined => (typeof value === 'string' && slugify(value)) || undefined

// Payload's slug field keeps following the title through autosaves until the first publish or a
// manual edit, then freezes so published URLs never change by accident.
export const slugField = (sourceField: string): Field =>
  payloadSlugField({
    useAsSlug: sourceField,
    slugify: ({ valueToSlugify }) => slugFrom(valueToSlugify),
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
