import { RichText } from '@payloadcms/richtext-lexical/react'

import type { RichTextData } from '@/lib/views'

// DESIGN.md › Components › Rich text.
const RICH_TEXT_CLASSES = [
  'max-w-measure flex flex-col gap-md',
  '[&_p]:type-body-lg [&_p]:text-on-surface-variant',
  '[&_h2]:type-headline-sm [&_h2]:mt-lg',
  '[&_h3]:type-body-lg [&_h3]:mt-md [&_h3]:font-semibold [&_h3]:text-on-surface',
  '[&_ul]:flex [&_ul]:list-[square] [&_ul]:flex-col [&_ul]:gap-sm [&_ul]:pl-lg [&_ul_li]:marker:text-primary',
  '[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-sm [&_ol]:pl-lg',
  '[&_li]:type-body-lg [&_li]:text-on-surface-variant',
  '[&_a]:text-on-surface [&_a]:underline [&_a]:underline-offset-4',
  '[&_strong]:text-on-surface',
].join(' ')

export function RichTextContent({ data }: { data: RichTextData }) {
  return <RichText data={data} className={RICH_TEXT_CLASSES} />
}
