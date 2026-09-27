import type { RichText } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps } from 'react'

export type MediaView = { url: string; alt: string }

export type DevelopmentStatus = 'in-development' | 'released' | 'paused'

export type RichTextData = ComponentProps<typeof RichText>['data']

export type ExternalLinkView = { label: string; url: string }
